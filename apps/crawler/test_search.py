"""전체 파이프라인 E2E 수동 스크립트 — 검색→프로필 탐색→분류→노션 저장.

pytest 대상이 아니다. 직접 실행: `uv run python test_search.py`
"""

import asyncio
import logging

from crawler.channels.naver_blog import search_blogs, explore_blogger
from crawler.classifier import classify
from crawler.models import (
    CrawledMember, CrawledPost, CrawledProfile, PLATFORM_NAVER, REGION_ENUM_BY_KR,
)
from crawler.notion import save_member

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


async def run():
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
    print(f"  블로그 홈: {profile.get('blog_home_url', '-')}")
    print(f"  프로필 소개: {profile.get('profile_intro', '-')[:200]}")
    print(f"  메인 배너: {profile.get('banner_image_url', '-')[:80]}")
    print(f"  본문 길이: {len(profile['about'])}자")
    print(f"  연락처: {profile.get('phone', '-')}")
    print(f"  이메일: {profile.get('email', '-')}")
    print(f"  인스타: {profile.get('instagram', '-')}")
    print(f"  수집 글: {len(profile.get('posts', []))}건")
    for post in profile.get("posts", []):
        print(f"    - {post['title'][:40]} (사진 {len(post['images'])}장)")
    print(f"  출처: {profile['source_urls']}")

    # Step 3: 분류 (프로필 소개 + 게시글 본문 종합)
    print("\n=== Step 3: 분류 ===")
    profile_intro = profile.get("profile_intro", "")
    combined_about = ""
    if profile_intro:
        combined_about += f"[블로그 프로필 소개]\n{profile_intro}\n\n"
    combined_about += f"[게시글 본문]\n{profile['about']}"
    result, _usage = await classify(
        name=item["bloggername"],
        about=combined_about,
        headline=profile.get("blog_title", ""),
    )
    print(f"  업체명: {result.get('name', '-')}")
    print(f"  시공분야: {result['trades']}")
    print(f"  직급: {result['rank']}")
    print(f"  지역: {result.get('region', '-')}")
    print(f"  주소: {result.get('address', '-')}")
    print(f"  경력: {result.get('experience', '-')}")

    # Step 4: 노션 저장 (중복 시 업데이트)
    print("\n=== Step 4: 노션 저장 ===")
    company = (
        result.get("name")
        or profile.get("blog_title")
        or profile.get("blogger_name")
        or item["bloggername"]
    )
    picture = profile.get("banner_image_url") or profile.get("profile_image_url") or profile.get("cover_image_url", "")
    detail_url = profile.get("blog_home_url") or item["link"]
    trades = result["trades"]
    member = CrawledMember(
        company=company,
        name=result.get("representative", ""),
        phone=profile.get("phone", ""),
        picture=picture,
        role=result["rank"],
        brn=result.get("business_number", ""),
        email=profile.get("email", ""),
        profile=CrawledProfile(
            primary_trade=trades[0] if trades else "",
            trades=trades,
            experience=result.get("experience"),
            headline=profile.get("profile_intro", "")[:500],
            about=profile["about"][:2000],
            address=result.get("address", ""),
            state=REGION_ENUM_BY_KR.get(result.get("region", ""), ""),
            url=detail_url,
            platform=PLATFORM_NAVER,
        ),
        posts=[CrawledPost(**post) for post in profile.get("posts", [])],
        source_urls=profile["source_urls"],
    )
    page_id = await save_member(member)
    print(f"  저장 완료: {page_id}")
    print(f"  https://www.notion.so/{page_id.replace('-', '')}")


if __name__ == "__main__":
    asyncio.run(run())
