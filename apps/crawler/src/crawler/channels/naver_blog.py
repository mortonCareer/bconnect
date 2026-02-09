"""네이버 블로그 채널 — 검색 API로 후보 발견 → 블로거 프로필 탐색 → 본문 파싱."""

import re
import logging
from urllib.parse import urlparse, parse_qs

import httpx
from bs4 import BeautifulSoup

from crawler.config import settings
from crawler.models import Technician

log = logging.getLogger(__name__)

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
        {"about": str, "source_url": str, "blogger_name": str, "cover_image_url": str}
    """
    content_url = _extract_post_content_url(blog_url) or blog_url

    async with httpx.AsyncClient(follow_redirects=True) as client:
        resp = await client.get(content_url)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    # 커버 이미지: og:image 메타 태그
    og_img = soup.select_one('meta[property="og:image"]')
    cover_image_url = og_img["content"] if og_img and og_img.get("content") else ""

    # 본문 영역 추출 (네이버 블로그 구조)
    content_area = (
        soup.select_one("div.se-main-container")       # 스마트에디터3
        or soup.select_one("div#postViewArea")          # 구버전
        or soup.select_one("div.post-view")             # 모바일
    )

    about = ""
    if content_area:
        # 노이즈 요소 제거 (외부 링크 카드, 스크립트, 위젯 등)
        for tag in content_area.select("script, style, iframe, div.se-oglink"):
            tag.decompose()

        raw = content_area.get_text(separator="\n", strip=True)
        # ZWSP 제거 + 오픈톡/카카오톡 위젯 텍스트 필터링
        lines = []
        for line in raw.split("\n"):
            stripped = line.strip("\u200b \t")
            if not stripped:
                continue
            if re.search(r"(오픈채팅|카카오톡 상담|네이버톡톡|톡톡 상담)", stripped):
                continue
            lines.append(stripped)
        about = "\n".join(lines)

    return {
        "about": about,
        "source_url": blog_url,
        "blogger_name": _extract_blogger_name(soup),
        "cover_image_url": cover_image_url,
    }


def _extract_blogger_name(soup: BeautifulSoup) -> str:
    """블로거 닉네임을 추출한다."""
    nick = soup.select_one("span.nick") or soup.select_one("strong.ell")
    return nick.get_text(strip=True) if nick else ""


def extract_blog_id(blog_url: str) -> str | None:
    """블로그 URL에서 블로거 ID를 추출한다."""
    parsed = urlparse(blog_url)
    host = parsed.hostname or ""
    if "blog.naver.com" not in host:
        return None
    parts = parsed.path.strip("/").split("/")
    return parts[0] if parts else None


async def fetch_blogger_posts(blog_id: str, count: int = 5) -> list[str]:
    """블로거의 최근 글 목록 URL을 가져온다 (RSS 활용)."""
    rss_url = f"https://rss.blog.naver.com/{blog_id}.xml"
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            resp = await client.get(rss_url)
            resp.raise_for_status()
        except Exception:
            log.warning("RSS 가져오기 실패: %s", blog_id)
            return []

    soup = BeautifulSoup(resp.text, "xml")
    links = []
    for item in soup.find_all("item")[:count]:
        link = item.find("link")
        if link and link.string:
            links.append(link.string.strip())
    return links


# 연락처 패턴: 010-XXXX-XXXX 또는 01012345678
_PHONE_RE = re.compile(r"01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}")
# 이메일 패턴
_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
# 인스타그램 패턴
_INSTA_RE = re.compile(r"instagram\.com/([a-zA-Z0-9_.]+)")


def extract_contact_info(text: str) -> dict:
    """텍스트에서 연락처, 이메일, 인스타 계정을 추출한다."""
    phones = _PHONE_RE.findall(text)
    emails = _EMAIL_RE.findall(text)
    instas = _INSTA_RE.findall(text)
    return {
        "phone": phones[0].replace("-", "").replace(".", "").replace(" ", "") if phones else "",
        "email": emails[0] if emails else "",
        "instagram": instas[0] if instas else "",
    }


async def explore_blogger(blog_url: str) -> dict:
    """블로거의 여러 글을 탐색하여 프로필 정보를 종합한다.

    검색 결과 글 + 최근 글에서 연락처/소개 정보를 수집한다.

    Returns:
        {"about": str, "phone": str, "email": str, "instagram": str,
         "blogger_name": str, "cover_image_url": str, "source_urls": [str]}
    """
    blog_id = extract_blog_id(blog_url)
    if not blog_id:
        post = await fetch_blog_post(blog_url)
        contact = extract_contact_info(post["about"])
        return {**post, **contact, "source_urls": [blog_url], "cover_image_url": post["cover_image_url"]}

    # 검색 결과 글 파싱
    main_post = await fetch_blog_post(blog_url)
    all_text = main_post["about"]
    source_urls = [blog_url]

    # 블로거의 다른 글도 탐색 (연락처/소개 찾기)
    other_urls = await fetch_blogger_posts(blog_id, count=5)
    for url in other_urls:
        if url == blog_url:
            continue
        try:
            post = await fetch_blog_post(url)
            text = post["about"]
            # 연락처가 있는 글이면 텍스트 수집
            contact = extract_contact_info(text)
            if contact["phone"] or contact["email"] or contact["instagram"]:
                all_text += "\n" + text
                source_urls.append(url)
                log.info("연락처 발견: %s → %s", url, contact)
                break  # 하나 찾으면 충분
        except Exception:
            continue

    contact = extract_contact_info(all_text)
    return {
        "about": main_post["about"],
        "blogger_name": main_post["blogger_name"],
        "cover_image_url": main_post["cover_image_url"],
        "source_urls": source_urls,
        **contact,
    }


def build_search_queries(keywords: list[str] | None = None) -> list[str]:
    """검색 키워드 × 쿼리 템플릿으로 검색 쿼리 목록을 생성한다."""
    from crawler.models import SEARCH_KEYWORDS

    keywords = keywords or SEARCH_KEYWORDS
    templates = ["{kw} 시공업체 수도권", "{kw} 시공 전문 서울 경기"]
    return [t.format(kw=kw) for kw in keywords for t in templates]
