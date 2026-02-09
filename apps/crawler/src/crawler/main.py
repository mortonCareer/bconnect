"""기술자 크롤링 파이프라인 — 검색 → 파싱 → 분류 → 중복체크 → 노션 저장."""

import asyncio
import logging

from crawler.channels.naver_blog import search_blogs, fetch_blog_post
from crawler.classifier import classify
from crawler.models import Technician
from crawler.notion import save_technician

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


async def process_blog_result(item: dict) -> Technician | None:
    """검색 결과 1건을 파이프라인에 통과시킨다."""
    blog_url = item["link"]
    blogger_name = item.get("bloggername", "")

    log.info("파싱 중: %s (%s)", blogger_name, blog_url)

    try:
        post = await fetch_blog_post(blog_url)
    except Exception:
        log.warning("파싱 실패: %s", blog_url, exc_info=True)
        return None

    if not post["about"]:
        log.info("본문 없음, 건너뜀: %s", blog_url)
        return None

    # LLM 분류
    classification = await classify(
        name=blogger_name,
        about=post["about"],
    )

    tech = Technician(
        name=blogger_name,
        rank=classification["rank"],
        trades=classification["trades"],
        about=post["about"],
        channels=["네이버블로그"],
        source_urls=[post["source_url"]],
        detail_url=blog_url,
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


def main():
    """CLI 진입점."""
    import sys

    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "인테리어 시공업체 수도권"
    asyncio.run(run_pipeline(query, count=10))


if __name__ == "__main__":
    main()
