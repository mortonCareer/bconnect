"""기술자 크롤링 파이프라인 — 검색 → 파싱 → 분류 → 중복체크 → 노션 저장."""

import asyncio
import logging

from crawler.channels.naver_blog import search_blogs, explore_blogger, build_search_queries, extract_blog_id
from crawler.classifier import classify
from crawler.models import Technician
from crawler.notion import save_technician, find_duplicate_by_url

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


async def process_blog_result(item: dict, seen_blog_ids: set[str] | None = None) -> Technician | None:
    """검색 결과 1건 → 블로거 프로필 탐색 → 분류 → Technician 생성."""
    blog_url = item["link"]
    blogger_name = item.get("bloggername", "")

    blog_id = extract_blog_id(blog_url)

    # 메모리 중복 체크: 같은 실행 내 이미 처리한 blog_id는 즉시 스킵
    if blog_id and seen_blog_ids is not None and blog_id in seen_blog_ids:
        log.info("이미 처리됨 (메모리), 건너뜀: %s (%s)", blogger_name, blog_id)
        return None

    # 노션 DB 중복 체크: 크롤링/LLM 전에 URL로 스킵 (비용 절약)
    if blog_id:
        detail_url = f"https://blog.naver.com/{blog_id}"
        existing = await find_duplicate_by_url(detail_url)
        if existing:
            if seen_blog_ids is not None:
                seen_blog_ids.add(blog_id)
            log.info("이미 등록됨, 건너뜀: %s (%s)", blogger_name, blog_id)
            return None

    log.info("탐색 중: %s (%s)", blogger_name, blog_url)

    try:
        profile = await explore_blogger(blog_url)
    except Exception:
        log.warning("탐색 실패: %s", blog_url, exc_info=True)
        return None

    profile_intro = profile.get("profile_intro", "")
    if not profile["about"] and not profile_intro:
        log.info("본문 없음, 건너뜀: %s", blog_url)
        return None

    # LLM 분류: 프로필 소개 + 게시글 본문을 종합하여 판단
    # profile_intro = 블로거가 작성한 업체 자기소개 (정확도 높음)
    # about = 검색된 게시글 본문 (시공 사례)
    combined_about = ""
    if profile_intro:
        combined_about += f"[블로그 프로필 소개]\n{profile_intro}\n\n"
    combined_about += f"[게시글 본문]\n{profile['about']}"

    classification = await classify(
        name=blogger_name,
        about=combined_about,
        headline=profile.get("blog_title", ""),
    )

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

    tech = Technician(
        name=name,
        rank=classification["rank"],
        trades=classification["trades"],
        region=classification.get("region", ""),
        address=classification.get("address", ""),
        headline=profile_intro[:500],
        about=profile["about"][:2000],
        phone=profile.get("phone", ""),
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
) -> list[str]:
    """단일 검색어로 파이프라인을 실행한다.

    Args:
        query: 네이버 검색 쿼리
        count: 수집할 결과 수
        seen_blog_ids: 실행 내 이미 처리한 blog_id (쿼리 간 공유)

    Returns:
        저장된 노션 page_id 목록
    """
    if seen_blog_ids is None:
        seen_blog_ids = set()

    log.info("검색 시작: '%s' (최대 %d건)", query, count)
    items = await search_blogs(query, display=count)
    log.info("검색 결과: %d건", len(items))

    saved_ids = []
    for item in items:
        tech = await process_blog_result(item, seen_blog_ids=seen_blog_ids)
        if tech is None:
            continue

        page_id = await save_technician(tech)
        log.info("저장 완료: %s → %s", tech.name, page_id)
        saved_ids.append(page_id)

    log.info("파이프라인 완료: %d/%d건 저장", len(saved_ids), len(items))
    return saved_ids


async def run_full(keywords: list[str] | None = None, per_query: int = 5) -> list[str]:
    """전체 키워드로 파이프라인을 실행한다."""
    queries = build_search_queries(keywords)
    log.info("총 %d개 쿼리 실행 예정", len(queries))

    seen_blog_ids: set[str] = set()
    all_ids = []
    for i, q in enumerate(queries, 1):
        log.info("[%d/%d] %s", i, len(queries), q)
        ids = await run_pipeline(q, count=per_query, seen_blog_ids=seen_blog_ids)
        all_ids.extend(ids)

    log.info("전체 완료: %d건 저장", len(all_ids))
    return all_ids


def main():
    """CLI 진입점.

    Usage:
        crawler                          # 단일 테스트 쿼리
        crawler "타일 시공업체 서울"       # 지정 쿼리
        crawler --full                   # 전체 키워드 실행
        crawler --full --per-query 3     # 키워드당 3건
    """
    import sys

    args = sys.argv[1:]

    if "--full" in args:
        per_query = 5
        if "--per-query" in args:
            idx = args.index("--per-query")
            per_query = int(args[idx + 1])
        asyncio.run(run_full(per_query=per_query))
    elif args:
        query = " ".join(args)
        asyncio.run(run_pipeline(query, count=10))
    else:
        asyncio.run(run_pipeline("타일 시공업체 수도권", count=3))


if __name__ == "__main__":
    main()
