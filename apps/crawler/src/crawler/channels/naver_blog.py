"""네이버 블로그 채널 — 검색 API로 후보 발견 → 본문 파싱."""

import re
from urllib.parse import urlparse, parse_qs

import httpx
from bs4 import BeautifulSoup

from crawler.config import settings
from crawler.models import Technician

NAVER_SEARCH_URL = "https://openapi.naver.com/v1/search/blog.json"


async def search_blogs(query: str, display: int = 10, start: int = 1) -> list[dict]:
    """네이버 검색 API로 블로그 검색 결과를 가져온다.

    Returns:
        [{"title", "link", "description", "bloggername", "bloggerlink"}, ...]
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            NAVER_SEARCH_URL,
            params={"query": query, "display": display, "start": start, "sort": "sim"},
            headers={
                "X-Naver-Client-Id": settings.naver_client_id,
                "X-Naver-Client-Secret": settings.naver_client_secret,
            },
        )
        resp.raise_for_status()
        return resp.json()["items"]


def _extract_post_content_url(blog_url: str) -> str | None:
    """네이버 블로그 URL에서 실제 본문 iframe URL을 추출한다.

    blog.naver.com/<id>/<logNo> → PostView.naver?blogId=<id>&logNo=<logNo>
    """
    parsed = urlparse(blog_url)
    # 모바일 URL 처리: m.blog.naver.com
    host = parsed.hostname or ""
    if "blog.naver.com" not in host:
        return None

    parts = parsed.path.strip("/").split("/")
    if len(parts) >= 2:
        blog_id, log_no = parts[0], parts[1]
        return f"https://blog.naver.com/PostView.naver?blogId={blog_id}&logNo={log_no}&noTrackingCode=true"

    return None


async def fetch_blog_post(blog_url: str) -> dict:
    """블로그 본문을 파싱하여 소개 텍스트와 메타정보를 추출한다.

    Returns:
        {"about": str, "source_url": str, "blogger_name": str}
    """
    content_url = _extract_post_content_url(blog_url) or blog_url

    async with httpx.AsyncClient(follow_redirects=True) as client:
        resp = await client.get(content_url)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    # 본문 영역 추출 (네이버 블로그 구조)
    content_area = (
        soup.select_one("div.se-main-container")       # 스마트에디터3
        or soup.select_one("div#postViewArea")          # 구버전
        or soup.select_one("div.post-view")             # 모바일
    )

    about = ""
    if content_area:
        about = content_area.get_text(separator="\n", strip=True)

    return {
        "about": about,
        "source_url": blog_url,
        "blogger_name": _extract_blogger_name(soup),
    }


def _extract_blogger_name(soup: BeautifulSoup) -> str:
    """블로거 닉네임을 추출한다."""
    nick = soup.select_one("span.nick") or soup.select_one("strong.ell")
    return nick.get_text(strip=True) if nick else ""


# TODO: 장수 — 검색 쿼리 전략
# 어떤 검색어 조합으로 기술자를 찾을지 결정 필요.
# 예시:
#   - "{시공분야} 시공업체 수도권" (분야별 검색)
#   - "인테리어 시공 반장 포트폴리오" (직급 키워드)
#   - "타일 시공 업체 서울" (지역+분야 조합)
#
# build_search_queries() 함수를 구현하면 파이프라인에서 자동으로 호출합니다.

def build_search_queries() -> list[str]:
    """크롤링에 사용할 검색 쿼리 목록을 생성한다."""
    raise NotImplementedError("검색 쿼리 전략을 구현해주세요")
