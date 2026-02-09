"""전체 파이프라인 E2E 테스트 — 검색→프로필 탐색→분류→노션 저장."""

import asyncio
import logging
from crawler.channels.naver_blog import search_blogs, explore_blogger
from crawler.classifier import classify
from crawler.models import Technician
from crawler.notion import save_technician

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


async def test():
    # Step 1: 검색
    print("=== Step 1: 네이버 검색 ===")
    items = await search_blogs("타일 시공업체 수도권", display=3)
    for i, item in enumerate(items, 1):
        print(f"  {i}. {item['bloggername']} - {item['link']}")

    if not items:
        print("검색 결과 없음")
        return

    # Step 2: 블로거 프로필 탐색 (연락처 포함)
    item = items[0]
    print(f"\n=== Step 2: 프로필 탐색 ({item['bloggername']}) ===")
    profile = await explore_blogger(item["link"])
    print(f"  본문 길이: {len(profile['about'])}자")
    print(f"  연락처: {profile.get('phone', '-')}")
    print(f"  이메일: {profile.get('email', '-')}")
    print(f"  인스타: {profile.get('instagram', '-')}")
    print(f"  출처: {profile['source_urls']}")

    # Step 3: 분류
    print("\n=== Step 3: 분류 ===")
    result = await classify(name=item["bloggername"], about=profile["about"])
    print(f"  시공분야: {result['trades']}")
    print(f"  직급: {result['rank']}")

    # Step 4: 노션 저장
    print("\n=== Step 4: 노션 저장 ===")
    tech = Technician(
        name=item["bloggername"],
        rank=result["rank"],
        trades=result["trades"],
        about=profile["about"][:2000],
        phone=profile.get("phone", ""),
        email=profile.get("email", ""),
        channels=["네이버블로그"],
        source_urls=profile["source_urls"],
        detail_url=item["link"],
    )
    page_id = await save_technician(tech)
    print(f"  저장 완료: {page_id}")
    print(f"  https://www.notion.so/{page_id.replace('-', '')}")


asyncio.run(test())
