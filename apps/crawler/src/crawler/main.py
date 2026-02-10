"""기술자 크롤링 파이프라인 — 검색 → 파싱 → 분류 → 중복체크 → 노션 저장."""

import asyncio
import logging
from pathlib import Path

from crawler.channels.naver_blog import search_blogs, explore_blogger, build_search_queries, extract_blog_id
from crawler.classifier import classify
from crawler.config import settings
from crawler.models import Technician
from crawler.notion import save_technician, find_duplicate_by_url, touch_synced_at
from crawler.report import PipelineReport
from crawler.progress import create_progress, print_summary, console

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


async def process_blog_result(
    item: dict,
    seen_blog_ids: set[str] | None = None,
    report: PipelineReport | None = None,
    dry_run: bool = False,
    force: bool = False,
) -> Technician | None:
    """검색 결과 1건 → 블로거 프로필 탐색 → 분류 → Technician 생성."""
    blog_url = item["link"]
    blogger_name = item.get("bloggername", "")

    blog_id = extract_blog_id(blog_url)

    # 메모리 중복 체크: 같은 실행 내 이미 처리한 blog_id는 즉시 스킵
    # force 모드에서도 같은 실행 내 중복은 스킵 (무한루프 방지)
    if blog_id and seen_blog_ids is not None and blog_id in seen_blog_ids:
        log.info("이미 처리됨 (메모리), 건너뜀: %s (%s)", blogger_name, blog_id)
        if report:
            report.add_skipped(blog_url, blogger_name, "메모리 중복")
        return None

    # 노션 DB 중복 체크: 크롤링/LLM 전에 URL로 스킵 (비용 절약)
    # dry_run 모드에서는 노션 조회 자체를 건너뜀
    # force 모드에서는 중복이 있어도 스킵하지 않고 재크롤링
    if blog_id and not dry_run and not force:
        detail_url = f"https://blog.naver.com/{blog_id}"
        existing = await find_duplicate_by_url(detail_url)
        if existing:
            await touch_synced_at(existing)
            if seen_blog_ids is not None:
                seen_blog_ids.add(blog_id)
            log.info("이미 등록됨, 싱크 시점 갱신: %s (%s)", blogger_name, blog_id)
            if report:
                report.add_synced(blog_url, blogger_name)
            return None

    log.info("탐색 중: %s (%s)", blogger_name, blog_url)

    try:
        profile = await explore_blogger(blog_url)
    except Exception as exc:
        log.warning("탐색 실패: %s", blog_url, exc_info=True)
        if report:
            report.add_failed(blog_url, blogger_name, "탐색", str(exc))
        return None

    profile_intro = profile.get("profile_intro", "")
    if not profile["about"] and not profile_intro:
        log.info("본문 없음, 건너뜀: %s", blog_url)
        if report:
            report.add_skipped(blog_url, blogger_name, "본문 없음")
        return None

    # LLM 분류: 프로필 소개 + 게시글 본문을 종합하여 판단
    combined_about = ""
    if profile_intro:
        combined_about += f"[블로그 프로필 소개]\n{profile_intro}\n\n"
    combined_about += f"[게시글 본문]\n{profile['about']}"

    try:
        classification, usage = await classify(
            name=blogger_name,
            about=combined_about,
            headline=profile.get("blog_title", ""),
        )
        if report:
            report.add_llm_usage(usage["input_tokens"], usage["output_tokens"])
    except Exception as exc:
        log.warning("분류 실패: %s", blog_url, exc_info=True)
        if report:
            report.add_failed(blog_url, blogger_name, "분류", str(exc))
        return None

    # 업체명: classify 결과 → blog_title → blogger_name 순 폴백
    name = (
        classification.get("name")
        or profile.get("blog_title")
        or profile.get("blogger_name")
        or blogger_name
    )

    # 커버 이미지: 메인 배너 → 프로필 이미지 → 게시글 og:image 순 폴백
    cover_image_url = (
        profile.get("banner_image_url")
        or profile.get("profile_image_url")
        or profile.get("cover_image_url", "")
    )

    # 자세히보기: 블로그 홈 → 게시글 URL 순 폴백
    detail_url = profile.get("blog_home_url") or blog_url

    # 연락처: 프로필 소개글 출처면 신뢰, 게시글 출처면 LLM 우선
    phone_source = profile.get("phone_source", "")
    regex_phone = profile.get("phone", "")
    llm_phone = classification.get("phone", "")
    if phone_source == "profile":
        phone = regex_phone  # 프로필 소개글 → 본인 번호, 신뢰
    else:
        phone = llm_phone or regex_phone  # LLM 판별 우선, 없으면 정규식 폴백

    tech = Technician(
        name=name,
        rank=classification["rank"],
        trades=classification["trades"],
        region=classification.get("region", ""),
        address=classification.get("address", ""),
        headline=profile_intro[:500],
        about=profile["about"][:2000],
        phone=phone,
        email=profile.get("email", ""),
        channels=["네이버블로그"],
        source_urls=profile["source_urls"],
        detail_url=detail_url,
        cover_image_url=cover_image_url,
    )

    if blog_id and seen_blog_ids is not None:
        seen_blog_ids.add(blog_id)

    return tech


async def run_pipeline(
    query: str, count: int = 10, seen_blog_ids: set[str] | None = None,
    report: PipelineReport | None = None, dry_run: bool = False,
    force: bool = False,
) -> list[str]:
    """단일 검색어로 파이프라인을 실행한다.

    Args:
        query: 네이버 검색 쿼리
        count: 수집할 결과 수
        seen_blog_ids: 실행 내 이미 처리한 blog_id (쿼리 간 공유)
        report: 실행 보고서 누적기
        dry_run: True면 노션 저장을 건너뛰고 분류까지만 수행
        force: True면 이미 등록된 업체도 재크롤링하여 덮어쓴다

    Returns:
        저장된 노션 page_id 목록 (dry_run 시 빈 리스트)
    """
    if seen_blog_ids is None:
        seen_blog_ids = set()

    if report:
        report.queries.append(query)

    log.info("검색 시작: '%s' (최대 %d건)", query, count)
    # 네이버 API display 최대 100 → 페이지네이션
    items: list[dict] = []
    page_size = min(count, 100)
    start = 1
    while len(items) < count:
        page = await search_blogs(query, display=page_size, start=start)
        if not page:
            break
        items.extend(page)
        start += len(page)
        if len(page) < page_size:
            break
    items = items[:count]
    log.info("검색 결과: %d건", len(items))

    if report:
        report.total_searched += len(items)

    saved_ids = []
    for item in items:
        tech = await process_blog_result(item, seen_blog_ids=seen_blog_ids, report=report, dry_run=dry_run, force=force)
        if tech is None:
            continue

        if dry_run:
            log.info("dry-run: %s (저장 건너뜀)", tech.name)
            if report:
                report.add_saved(
                    blog_url=item["link"], blogger_name=item.get("bloggername", ""),
                    tech_name=tech.name, rank=tech.rank, trades=tech.trades,
                    phone=tech.phone, page_id="",
                    region=tech.region, address=tech.address, email=tech.email,
                )
            continue

        try:
            page_id = await save_technician(tech, force=force)
        except Exception as exc:
            log.warning("저장 실패: %s", item["link"], exc_info=True)
            if report:
                report.add_failed(item["link"], item.get("bloggername", ""), "저장", str(exc))
            continue

        log.info("저장 완료: %s → %s", tech.name, page_id)
        saved_ids.append(page_id)
        if report:
            report.add_saved(
                blog_url=item["link"], blogger_name=item.get("bloggername", ""),
                tech_name=tech.name, rank=tech.rank, trades=tech.trades,
                phone=tech.phone, page_id=page_id,
                region=tech.region, address=tech.address, email=tech.email,
            )

    log.info("파이프라인 완료: %d/%d건 저장", len(saved_ids), len(items))
    return saved_ids


async def run_full(keywords: list[str] | None = None, per_query: int = 5, dry_run: bool = False, force: bool = False) -> PipelineReport:
    """전체 키워드로 파이프라인을 실행한다."""
    queries = build_search_queries(keywords)

    report = PipelineReport()
    report.mode = "전체 키워드"
    report.per_query = per_query
    report.llm_model = settings.openai_model if settings.openai_api_key else settings.anthropic_model

    # progress bar 모드: INFO 로그 억제, rich가 표시
    logging.getLogger().setLevel(logging.WARNING)

    seen_blog_ids: set[str] = set()
    all_ids = []
    progress = create_progress()
    with progress:
        task_all = progress.add_task(
            f"전체 ({len(queries)} 쿼리)", total=len(queries),
        )
        for i, q in enumerate(queries, 1):
            progress.update(task_all, description=f"[{i}/{len(queries)}] {q[:30]}")
            ids = await run_pipeline(q, count=per_query, seen_blog_ids=seen_blog_ids, report=report, dry_run=dry_run, force=force)
            all_ids.extend(ids)
            progress.advance(task_all)
            # 레이트 리밋 방지: 쿼리 간 0.5초 딜레이
            if i < len(queries):
                await asyncio.sleep(0.5)

    # 로그 레벨 복원
    logging.getLogger().setLevel(logging.INFO)
    return report


REPORTS_DIR = Path("reports")


def main():
    """CLI 진입점.

    Usage:
        crawler                          # 단일 테스트 쿼리
        crawler "타일 시공업체 서울"       # 지정 쿼리
        crawler --full                   # 전체 키워드 실행
        crawler --full --per-query 3     # 키워드당 3건
        crawler --dry-run "도배 시공업체" # 노션 저장 없이 분류까지만
        crawler --force "타일 시공업체"   # 기존 업체도 재크롤링하여 덮어쓰기
    """
    import sys

    args = sys.argv[1:]
    dry_run = "--dry-run" in args
    if dry_run:
        args.remove("--dry-run")
    force = "--force" in args
    if force:
        args.remove("--force")

    llm_model = settings.openai_model if settings.openai_api_key else settings.anthropic_model
    report = PipelineReport()
    report.llm_model = llm_model

    if dry_run:
        console.print("[yellow]dry-run 모드: 노션 저장 건너뜀[/yellow]")
    if force:
        console.print("[yellow]force 모드: 기존 업체 데이터 덮어쓰기[/yellow]")

    try:
        if "--full" in args:
            per_query = 5
            if "--per-query" in args:
                idx = args.index("--per-query")
                per_query = int(args[idx + 1])
            report = asyncio.run(run_full(per_query=per_query, dry_run=dry_run, force=force))
        else:
            count = 10
            query = " ".join(args) if args else "타일 시공업체 수도권"
            if not args:
                count = 3
            report.mode = "단일 쿼리"
            report.per_query = count
            asyncio.run(run_pipeline(query, count=count, report=report, dry_run=dry_run, force=force))
    except KeyboardInterrupt:
        console.print("\n[yellow]중단됨 — 부분 보고서 저장 중...[/yellow]")
    except Exception as exc:
        console.print(f"\n[red]오류: {exc}[/red]")
        report.add_failed("", "", "파이프라인", str(exc))

    md_path = report.save(REPORTS_DIR)
    print_summary(report)
    console.print(f"보고서: [link=file://{md_path.resolve()}]{md_path}[/link]")


if __name__ == "__main__":
    main()
