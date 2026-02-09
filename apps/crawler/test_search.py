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
    print(f"  블로그 제목: {profile.get('blog_title', '-')}")
    print(f"  프로필 소개: {profile.get('profile_intro', '-')[:200]}")
    print(f"  본문 길이: {len(profile['about'])}자")
    print(f"  연락처: {profile.get('phone', '-')}")
    print(f"  이메일: {profile.get('email', '-')}")
    print(f"  인스타: {profile.get('instagram', '-')}")
    print(f"  커버 이미지: {profile.get('cover_image_url', '-')[:80]}")
    print(f"  출처: {profile['source_urls']}")

    # Step 3: 분류 (프로필 소개 + 게시글 본문 종합)
    print("\n=== Step 3: 분류 ===")
    profile_intro = profile.get("profile_intro", "")
    combined_about = ""
    if profile_intro:
        combined_about += f"[블로그 프로필 소개]\n{profile_intro}\n\n"
    combined_about += f"[게시글 본문]\n{profile['about']}"
    result = await classify(
        name=item["bloggername"],
        about=combined_about,
        headline=profile.get("blog_title", ""),
    )
    print(f"  업체명: {result.get('name', '-')}")
    print(f"  시공분야: {result['trades']}")
    print(f"  직급: {result['rank']}")
    print(f"  지역: {result.get('region', '-')}")
    print(f"  주소: {result.get('address', '-')}")

    # Step 4: 노션 저장 (중복 시 업데이트)
    print("\n=== Step 4: 노션 저장 ===")
    name = (
        result.get("name")
        or profile.get("blog_title")
        or profile.get("blogger_name")
        or item["bloggername"]
    )
    tech = Technician(
        name=name,
        rank=result["rank"],
        trades=result["trades"],
        region=result.get("region", ""),
        address=result.get("address", ""),
        headline=profile.get("profile_intro", "")[:500],
        about=profile["about"][:2000],
        phone=profile.get("phone", ""),
        email=profile.get("email", ""),
        channels=["네이버블로그"],
        source_urls=profile["source_urls"],
        detail_url=item["link"],
        cover_image_url=profile.get("cover_image_url", ""),
    )
    page_id = await save_technician(tech)
    print(f"  저장 완료: {page_id}")
    print(f"  https://www.notion.so/{page_id.replace('-', '')}")


asyncio.run(test())
