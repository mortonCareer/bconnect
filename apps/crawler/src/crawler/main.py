"""기술자 크롤링 파이프라인 — 검색 → 파싱 → 분류 → 중복체크 → 노션 저장."""

import asyncio
import logging

from crawler.channels.naver_blog import search_blogs, explore_blogger, build_search_queries
from crawler.classifier import classify
from crawler.models import Technician
from crawler.notion import save_technician

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


async def process_blog_result(item: dict) -> Technician | None:
    """검색 결과 1건 → 블로거 프로필 탐색 → 분류 → Technician 생성."""
    blog_url = item["link"]
    blogger_name = item.get("bloggername", "")

    log.info("탐색 중: %s (%s)", blogger_name, blog_url)

    try:
        profile = await explore_blogger(blog_url)
    except Exception:
        log.warning("탐색 실패: %s", blog_url, exc_info=True)
        return None

    if not profile["about"]:
        log.info("본문 없음, 건너뜀: %s", blog_url)
        return None

    # LLM 분류 (업체명, 시공분야, 직급, 지역, 주소)
    headline = item.get("description", "")
    classification = await classify(
        name=blogger_name,
        about=profile["about"],
        headline=headline,
    )

    # classify()가 추출한 업체명 우선, 없으면 블로그 닉네임 폴백
    name = classification.get("name") or profile.get("blogger_name") or blogger_name

    tech = Technician(
        name=name,
        rank=classification["rank"],
        trades=classification["trades"],
        region=classification.get("region", ""),
        address=classification.get("address", ""),
        about=profile["about"][:2000],
        phone=profile.get("phone", ""),
        email=profile.get("email", ""),
        channels=["네이버블로그"],
        source_urls=profile["source_urls"],
        detail_url=blog_url,
        cover_image_url=profile.get("cover_image_url", ""),
    )

    return tech


async def run_pipeline(query: str, count: int = 10) -> list[str]:
    """단일 검색어로 파이프라인을 실행한다.

    Args:
        query: 네이버 검색 쿼리
        count: 수집할 결과 수

    Returns:
        저장된 노션 page_id 목록
    """
    log.info("검색 시작: '%s' (최대 %d건)", query, count)
    items = await search_blogs(query, display=count)
    log.info("검색 결과: %d건", len(items))

    saved_ids = []
    for item in items:
        tech = await process_blog_result(item)
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

    all_ids = []
    for i, q in enumerate(queries, 1):
        log.info("[%d/%d] %s", i, len(queries), q)
        ids = await run_pipeline(q, count=per_query)
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
