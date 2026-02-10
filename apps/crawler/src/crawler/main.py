"""기술자 크롤링 파이프라인 — 검색 → 파싱 → 분류 → 중복체크 → 노션 저장."""

import asyncio
import logging
from pathlib import Path

from crawler.channels.naver_blog import search_blogs, search_local, explore_blogger, build_search_queries, extract_blog_id, extract_contact_info
from crawler.classifier import classify
from crawler.config import settings
from crawler.models import Technician
from crawler.notion import save_technician, find_duplicate_by_url, touch_synced_at, find_pages_missing_phone, update_phone
from crawler.report import PipelineReport
from crawler.progress import create_progress, print_summary, console

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

REPORTS_DIR = Path("reports")

# 동시 처리 제한: 네이버 스크래핑 + LLM + 노션 API 동시 요청 수
CONCURRENCY = 5
# --full 모드에서 동시에 실행할 쿼리 수
QUERY_CONCURRENCY = 3


def setup_file_logging() -> None:
    """reports/ 디렉토리에 파일 로거를 추가한다.

    콘솔 로그가 억제돼도 디버그 로그가 파일에 보존된다.
    """
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    from datetime import datetime, timezone

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M%S")
    handler = logging.FileHandler(REPORTS_DIR / f"{stamp}.log", encoding="utf-8")
    handler.setLevel(logging.DEBUG)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    logging.getLogger().addHandler(handler)


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

    # 병렬 처리 시 같은 blog_id 이중 진입 방지: 탐색 전에 선점
    if blog_id and seen_blog_ids is not None:
        seen_blog_ids.add(blog_id)

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

    # 이메일: LLM → 정규식 폴백
    email = classification.get("email", "") or profile.get("email", "")
    address = classification.get("address", "")

    # 네이버 지역검색으로 부족한 필드 보충
    if name and (not phone or not address):
        place = await search_local(name)
        if place:
            if not phone and place["telephone"]:
                raw = place["telephone"].replace("-", "").replace(" ", "")
                if raw.startswith("01") or raw.startswith("02") or raw.startswith("0"):
                    phone = raw
                    log.info("지역검색 연락처 보충: %s → %s", name, phone)
            if not address and (place["road_address"] or place["address"]):
                address = place["road_address"] or place["address"]
                log.info("지역검색 주소 보충: %s → %s", name, address)

    tech = Technician(
        name=name,
        rank=classification["rank"],
        trades=classification["trades"],
        region=classification.get("region", ""),
        address=address,
        representative=classification.get("representative", ""),
        business_number=classification.get("business_number", ""),
        headline=profile_intro[:500],
        about=profile["about"][:2000],
        phone=phone,
        email=email,
        channels=["네이버블로그"],
        source_urls=profile["source_urls"],
        detail_url=detail_url,
        cover_image_url=cover_image_url,
    )

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

    sem = asyncio.Semaphore(CONCURRENCY)
    saved_ids: list[str] = []

    async def _handle(item: dict) -> None:
        async with sem:
            tech = await process_blog_result(item, seen_blog_ids=seen_blog_ids, report=report, dry_run=dry_run, force=force)
        if tech is None:
            return

        blog_url = item["link"]
        blogger_name = item.get("bloggername", "")

        if dry_run:
            log.info("dry-run: %s (저장 건너뜀)", tech.name)
            if report:
                report.technicians.append(tech.model_dump())
                report.add_saved(
                    blog_url=blog_url, blogger_name=blogger_name,
                    tech_name=tech.name, rank=tech.rank, trades=tech.trades,
                    phone=tech.phone, page_id="",
                    region=tech.region, address=tech.address, email=tech.email,
                )
            return

        try:
            page_id = await save_technician(tech, force=force)
        except Exception as exc:
            log.warning("저장 실패: %s", blog_url, exc_info=True)
            if report:
                report.add_failed(blog_url, blogger_name, "저장", str(exc))
            return

        log.info("저장 완료: %s → %s", tech.name, page_id)
        saved_ids.append(page_id)
        if report:
            report.add_saved(
                blog_url=blog_url, blogger_name=blogger_name,
                tech_name=tech.name, rank=tech.rank, trades=tech.trades,
                phone=tech.phone, page_id=page_id,
                region=tech.region, address=tech.address, email=tech.email,
            )

    await asyncio.gather(*[_handle(item) for item in items])

    log.info("파이프라인 완료: %d/%d건 저장", len(saved_ids), len(items))
    return saved_ids


async def run_full(keywords: list[str] | None = None, per_query: int = 5, dry_run: bool = False, force: bool = False) -> PipelineReport:
    """전체 키워드로 파이프라인을 실행한다.

    쿼리를 QUERY_CONCURRENCY개씩 병렬 실행하여 전체 소요 시간을 단축한다.
    개별 쿼리 실패 시 최대 2회 재시도하고, 그래도 실패하면 건너뛴다.
    """
    queries = build_search_queries(keywords)

    report = PipelineReport()
    report.mode = "전체 키워드"
    report.per_query = per_query
    report.llm_model = settings.openai_model if settings.openai_api_key else settings.anthropic_model

    seen_blog_ids: set[str] = set()
    completed = 0
    query_sem = asyncio.Semaphore(QUERY_CONCURRENCY)

    async def _run_query(q: str) -> None:
        nonlocal completed
        async with query_sem:
            for attempt in range(3):
                try:
                    await run_pipeline(
                        q, count=per_query, seen_blog_ids=seen_blog_ids,
                        report=report, dry_run=dry_run, force=force,
                    )
                    break
                except Exception as exc:
                    if attempt < 2:
                        wait = 2 ** attempt
                        log.warning("쿼리 실패 '%s' (%s), %d초 후 재시도 (%d/3)", q, exc, wait, attempt + 1)
                        await asyncio.sleep(wait)
                    else:
                        log.error("쿼리 포기 '%s': %s", q, exc)
                        report.add_failed("", "", "쿼리", f"{q}: {exc}")
            completed += 1
            progress.update(task_all, completed=completed)

    progress = create_progress()
    with progress:
        task_all = progress.add_task(
            f"전체 ({len(queries)} 쿼리)", total=len(queries),
        )
        await asyncio.gather(*[_run_query(q) for q in queries])

    return report


async def run_from_file(file_path: Path, force: bool = False) -> PipelineReport:
    """dry-run 보고서 JSON에서 Technician 데이터를 읽어 노션에 저장한다."""
    import json

    data = json.loads(file_path.read_text(encoding="utf-8"))
    technicians_data = data.get("technicians", [])
    if not technicians_data:
        raise ValueError(f"파일에 technicians 데이터가 없습니다: {file_path}")

    report = PipelineReport()
    report.mode = "파일 임포트"
    report.llm_model = data.get("params", {}).get("llm_model", "")

    log.info("파일 임포트: %s (%d건)", file_path, len(technicians_data))
    saved_ids = []
    for tech_data in technicians_data:
        tech = Technician(**tech_data)
        try:
            page_id = await save_technician(tech, force=force)
        except Exception as exc:
            log.warning("저장 실패: %s", tech.name, exc_info=True)
            report.add_failed(tech.detail_url, tech.name, "저장", str(exc))
            continue

        log.info("저장 완료: %s → %s", tech.name, page_id)
        saved_ids.append(page_id)
        report.add_saved(
            blog_url=tech.detail_url, blogger_name=tech.name,
            tech_name=tech.name, rank=tech.rank, trades=tech.trades,
            phone=tech.phone, page_id=page_id,
            region=tech.region, address=tech.address, email=tech.email,
        )

    log.info("임포트 완료: %d/%d건 저장", len(saved_ids), len(technicians_data))
    return report


async def run_fill_phones() -> PipelineReport:
    """노션 DB에서 연락처 빈 레코드를 찾아 재탐색한다. LLM 호출 없이 정규식만 사용."""
    pages = await find_pages_missing_phone()
    log.info("연락처 누락 레코드: %d건", len(pages))

    report = PipelineReport()
    report.mode = "연락처 보충"
    report.total_searched = len(pages)

    sem = asyncio.Semaphore(CONCURRENCY)
    filled = 0

    async def _handle(page: dict) -> None:
        nonlocal filled
        page_id = page["page_id"]
        detail_url = page["detail_url"]
        name = page["name"]

        if not detail_url:
            report.add_skipped(detail_url, name, "URL 없음")
            return

        async with sem:
            try:
                profile = await explore_blogger(detail_url)
            except Exception as exc:
                log.warning("탐색 실패: %s", detail_url, exc_info=True)
                report.add_failed(detail_url, name, "탐색", str(exc))
                return

        phone = profile.get("phone", "")
        if not phone:
            report.add_skipped(detail_url, name, "연락처 없음")
            return

        try:
            await update_phone(page_id, phone)
        except Exception as exc:
            log.warning("업데이트 실패: %s", detail_url, exc_info=True)
            report.add_failed(detail_url, name, "저장", str(exc))
            return

        filled += 1
        log.info("연락처 보충: %s → %s", name, phone)
        report.add_saved(
            blog_url=detail_url, blogger_name=name,
            tech_name=name, rank="", trades=[], phone=phone, page_id=page_id,
        )

    progress = create_progress()
    with progress:
        task = progress.add_task(f"연락처 보충 ({len(pages)}건)", total=len(pages))
        # 10개씩 배치 처리 (진행률 업데이트용)
        batch_size = 10
        for i in range(0, len(pages), batch_size):
            batch = pages[i:i + batch_size]
            await asyncio.gather(*[_handle(p) for p in batch])
            progress.advance(task, len(batch))

    log.info("연락처 보충 완료: %d/%d건", filled, len(pages))
    return report


def main():
    """CLI 진입점."""
    import argparse

    parser = argparse.ArgumentParser(
        prog="crawler",
        description="네이버 블로그 기술자 크롤링 파이프라인",
    )
    parser.add_argument("query", nargs="*", help="검색 쿼리 (기본: '타일 시공업체 수도권')")
    parser.add_argument("--full", action="store_true", help="전체 키워드 실행 (136쿼리)")
    parser.add_argument("--per-query", type=int, default=5, help="쿼리당 수집 수 (기본: 5)")
    parser.add_argument("--dry-run", action="store_true", help="노션 저장 없이 분류까지만 수행")
    parser.add_argument("--force", action="store_true", help="기존 업체도 재크롤링하여 덮어쓰기")
    parser.add_argument("--from-file", type=Path, metavar="JSON", help="검수한 JSON에서 노션 저장")
    parser.add_argument("--fill-phones", action="store_true", help="연락처 빈 레코드를 재탐색하여 보충")
    args = parser.parse_args()

    setup_file_logging()

    llm_model = settings.openai_model if settings.openai_api_key else settings.anthropic_model
    report = PipelineReport()
    report.llm_model = llm_model

    if args.dry_run:
        console.print("[yellow]dry-run 모드: 노션 저장 건너뜀[/yellow]")
    if args.force:
        console.print("[yellow]force 모드: 기존 업체 데이터 덮어쓰기[/yellow]")
    if args.from_file:
        console.print(f"[yellow]파일 임포트: {args.from_file}[/yellow]")
    if args.fill_phones:
        console.print("[yellow]연락처 보충 모드: 빈 레코드 재탐색[/yellow]")

    # 프로그레스 바 모드: 콘솔 로그 억제 (파일 로그는 유지됨)
    suppress_console = args.full or args.fill_phones
    if suppress_console:
        logging.getLogger().setLevel(logging.WARNING)

    try:
        if args.fill_phones:
            report = asyncio.run(run_fill_phones())
        elif args.from_file:
            report = asyncio.run(run_from_file(args.from_file, force=args.force))
        elif args.full:
            report = asyncio.run(run_full(per_query=args.per_query, dry_run=args.dry_run, force=args.force))
        else:
            query = " ".join(args.query) if args.query else "타일 시공업체 수도권"
            count = 10 if args.query else 3
            report.mode = "단일 쿼리"
            report.per_query = count
            asyncio.run(run_pipeline(query, count=count, report=report, dry_run=args.dry_run, force=args.force))
    except KeyboardInterrupt:
        console.print("\n[yellow]중단됨 — 부분 보고서 저장 중...[/yellow]")
    except Exception as exc:
        console.print(f"\n[red]오류: {exc}[/red]")
        report.add_failed("", "", "파이프라인", str(exc))
    finally:
        if suppress_console:
            logging.getLogger().setLevel(logging.INFO)

    md_path = report.save(REPORTS_DIR)
    print_summary(report)
    console.print(f"보고서: [link=file://{md_path.resolve()}]{md_path}[/link]")


if __name__ == "__main__":
    main()
