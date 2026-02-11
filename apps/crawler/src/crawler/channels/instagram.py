"""인스타그램 채널 — 네이버 웹검색으로 프로필 발견 → meta 태그에서 프로필 정보 수집."""

import asyncio
import re
import logging

import httpx
from bs4 import BeautifulSoup

from crawler.config import settings

log = logging.getLogger(__name__)

NAVER_WEB_SEARCH_URL = "https://openapi.naver.com/v1/search/webkr.json"

_GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

# --- 모듈 공유 싱글턴 ---

_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(follow_redirects=True, timeout=15.0)
    return _client


# --- URL 파싱 ---

_INSTAGRAM_URL_RE = re.compile(
    r"(?:https?://)?(?:www\.)?instagram\.com/([a-zA-Z0-9_.]+)/?",
    re.IGNORECASE,
)

_NON_PROFILE_PATHS = frozenset(
    {"p", "reel", "reels", "explore", "stories", "accounts", "about", "developer", "direct", "tv"}
)


def extract_username(url: str) -> str | None:
    """인스타그램 URL에서 사용자명을 추출한다.

    /p/, /reel/, /explore/ 등 비프로필 경로는 None을 반환한다.
    """
    match = _INSTAGRAM_URL_RE.match(url)
    if not match:
        return None
    username = match.group(1).lower()
    if username in _NON_PROFILE_PATHS:
        return None
    return username


# --- HTML 태그 제거 ---

_HTML_TAG_RE = re.compile(r"<[^>]+>")


# --- meta 태그 파싱 ---

_BIO_SEPARATOR_RE = re.compile(r"님의 Instagram 계정: ['\"]?")
_OG_TITLE_NAME_RE = re.compile(r"^(.+?)\s*\(@")


def _parse_bio_from_description(description: str) -> str:
    """meta description에서 bio 텍스트를 추출한다.

    형식: '팔로워 N명, ... - 이름 (@user)님의 Instagram 계정: 'bio 텍스트''
    """
    match = _BIO_SEPARATOR_RE.search(description)
    if match:
        bio = description[match.end():].rstrip("'\"")
        return bio
    return description


def _parse_full_name_from_title(title: str) -> str:
    """og:title에서 프로필 이름을 추출한다.

    형식: '이름(@username) • Instagram 사진 및 동영상'
    """
    match = _OG_TITLE_NAME_RE.match(title)
    if match:
        return match.group(1).strip()
    return ""


# --- 검색 ---


async def search_instagram(
    query: str, display: int = 10, start: int = 1, *, _retries: int = 3,
) -> list[dict]:
    """네이버 웹검색 API로 인스타그램 프로필을 검색한다.

    Returns:
        [{"title", "link", "description", "username"}, ...]
        link가 instagram.com 프로필 URL인 결과만 필터링하여 반환.
    """
    client = _get_client()
    last_exc: Exception | None = None

    for attempt in range(_retries):
        try:
            resp = await client.get(
                NAVER_WEB_SEARCH_URL,
                params={"query": query, "display": display, "start": start},
                headers={
                    "X-Naver-Client-Id": settings.naver_client_id,
                    "X-Naver-Client-Secret": settings.naver_client_secret,
                },
            )
        except (httpx.TimeoutException, httpx.ConnectError) as exc:
            last_exc = exc
            wait = 2**attempt
            log.warning(
                "웹검색 요청 실패 (%s), %d초 후 재시도 (%d/%d)",
                type(exc).__name__, wait, attempt + 1, _retries,
            )
            await asyncio.sleep(wait)
            continue

        if resp.status_code in (429, 500, 502, 503) and attempt < _retries - 1:
            wait = 2**attempt
            log.warning(
                "웹검색 HTTP %d, %d초 후 재시도 (%d/%d)",
                resp.status_code, wait, attempt + 1, _retries,
            )
            await asyncio.sleep(wait)
            continue
        resp.raise_for_status()

        items = resp.json().get("items", [])
        filtered: list[dict] = []
        for item in items:
            link = item.get("link", "")
            username = extract_username(link)
            if username:
                title = _HTML_TAG_RE.sub("", item.get("title", ""))
                description = _HTML_TAG_RE.sub("", item.get("description", ""))
                filtered.append({
                    "title": title,
                    "link": link,
                    "description": description,
                    "username": username,
                })
        return filtered

    if last_exc:
        raise last_exc
    return []


# --- 프로필 탐색 ---


def _empty_profile(username: str) -> dict:
    """접근 불가 프로필의 빈 결과."""
    return {
        "about": "",
        "headline": "",
        "full_name": "",
        "profile_pic_url": "",
        "external_url": "",
        "source_urls": [f"https://www.instagram.com/{username}/"],
        "phone": "",
        "email": "",
        "instagram": username,
        "youtube": "",
    }


async def explore_profile(username: str) -> dict:
    """Googlebot UA로 인스타 프로필 페이지의 meta 태그에서 정보를 수집한다."""
    from crawler.channels.naver_blog import extract_contact_info

    client = _get_client()
    profile_url = f"https://www.instagram.com/{username}/"

    try:
        resp = await client.get(
            profile_url,
            headers={
                "User-Agent": _GOOGLEBOT_UA,
                "Accept-Language": "ko-KR,ko;q=0.9",
            },
        )
    except (httpx.TimeoutException, httpx.ConnectError) as exc:
        log.warning("인스타 프로필 요청 실패: %s — %s", username, exc)
        return _empty_profile(username)

    if resp.status_code != 200:
        log.info("인스타 프로필 HTTP %d: %s", resp.status_code, username)
        return _empty_profile(username)

    soup = BeautifulSoup(resp.text, "lxml")

    # og:title → full_name
    og_title_tag = soup.find("meta", property="og:title")
    og_title = og_title_tag["content"] if og_title_tag and og_title_tag.get("content") else ""
    full_name = _parse_full_name_from_title(og_title)

    # og:image → 프로필 사진
    og_image_tag = soup.find("meta", property="og:image")
    profile_pic_url = og_image_tag["content"] if og_image_tag and og_image_tag.get("content") else ""

    # <meta name="description"> → bio 텍스트
    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = desc_tag["content"] if desc_tag and desc_tag.get("content") else ""
    bio = _parse_bio_from_description(description) if description else ""

    if not bio and not full_name:
        log.info("프로필 meta 태그 없음: %s", username)
        return _empty_profile(username)

    # bio에서 연락처 추출
    contact = extract_contact_info(bio)

    about_parts: list[str] = []
    if bio:
        about_parts.append(f"[프로필 소개]\n{bio}")
    about = "\n\n".join(about_parts)

    return {
        "about": about,
        "headline": bio[:500],
        "full_name": full_name,
        "profile_pic_url": profile_pic_url,
        "external_url": "",
        "source_urls": [profile_url],
        "phone": contact["phone"],
        "email": contact["email"],
        "instagram": contact["instagram"] or username,
        "youtube": contact["youtube"],
    }


# --- 검색 쿼리 생성 ---


def build_search_queries(keywords: list[str] | None = None) -> list[str]:
    """검색 키워드 × 쿼리 템플릿으로 인스타그램 검색 쿼리 목록을 생성한다."""
    from crawler.models import SEARCH_KEYWORDS

    keywords = keywords or SEARCH_KEYWORDS
    templates = [
        "{kw} 인스타 시공업체 site:instagram.com",
        "{kw} 인스타그램 시공 site:instagram.com",
    ]
    return [t.format(kw=kw) for kw in keywords for t in templates]
