"""네이버 블로그 채널 — 검색 API로 후보 발견 → 블로거 프로필 탐색 → 본문 파싱."""

import asyncio
import json
import re
import logging
from urllib.parse import urlparse, parse_qs

import httpx
from bs4 import BeautifulSoup

from crawler.config import settings
from crawler.models import Technician

log = logging.getLogger(__name__)

NAVER_SEARCH_URL = "https://openapi.naver.com/v1/search/blog.json"
NAVER_LOCAL_URL = "https://openapi.naver.com/v1/search/local.json"

# 모듈 공유 httpx 클라이언트 — 커넥션 풀 재사용
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(follow_redirects=True, timeout=15.0)
    return _client


async def search_blogs(
    query: str, display: int = 10, start: int = 1, *, _retries: int = 3,
) -> list[dict]:
    """네이버 검색 API로 블로그 검색 결과를 가져온다.

    429(레이트 리밋) 및 일시적 오류(타임아웃, 5xx) 시 지수 백오프로 재시도한다.

    Returns:
        [{"title", "link", "description", "bloggername", "bloggerlink"}, ...]
    """
    client = _get_client()
    last_exc: Exception | None = None
    for attempt in range(_retries):
        try:
            resp = await client.get(
                NAVER_SEARCH_URL,
                params={"query": query, "display": display, "start": start, "sort": "sim"},
                headers={
                    "X-Naver-Client-Id": settings.naver_client_id,
                    "X-Naver-Client-Secret": settings.naver_client_secret,
                },
            )
        except (httpx.TimeoutException, httpx.ConnectError) as exc:
            last_exc = exc
            wait = 2 ** attempt
            log.warning("검색 요청 실패 (%s), %d초 후 재시도 (%d/%d)", type(exc).__name__, wait, attempt + 1, _retries)
            await asyncio.sleep(wait)
            continue

        if resp.status_code in (429, 500, 502, 503) and attempt < _retries - 1:
            wait = 2 ** attempt
            log.warning("검색 HTTP %d, %d초 후 재시도 (%d/%d)", resp.status_code, wait, attempt + 1, _retries)
            await asyncio.sleep(wait)
            continue
        resp.raise_for_status()
        return resp.json()["items"]

    if last_exc:
        raise last_exc
    return []


async def search_local(query: str) -> dict | None:
    """네이버 지역검색 API로 업체 정보를 조회한다.

    Returns:
        {"telephone": str, "address": str, "road_address": str, "title": str} 또는 None
    """
    client = _get_client()
    try:
        resp = await client.get(
            NAVER_LOCAL_URL,
            params={"query": query, "display": 1},
            headers={
                "X-Naver-Client-Id": settings.naver_client_id,
                "X-Naver-Client-Secret": settings.naver_client_secret,
            },
        )
        resp.raise_for_status()
    except Exception:
        log.debug("지역검색 실패: %s", query)
        return None

    items = resp.json().get("items", [])
    if not items:
        return None

    item = items[0]
    # HTML 태그 제거 (<b> 등)
    title = re.sub(r"<[^>]+>", "", item.get("title", ""))
    return {
        "title": title,
        "telephone": item.get("telephone", ""),
        "address": item.get("address", ""),
        "road_address": item.get("roadAddress", ""),
    }


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

    client = _get_client()
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


def _parse_business_info_from_html(html: str, blog_id: str) -> dict:
    """모바일 페이지 __INITIAL_STATE__에서 사업자정보를 추출한다."""
    match = re.search(r"window\.__INITIAL_STATE__\s*=\s*(.+?);\s*\n", html)
    if not match:
        return {}

    raw = match.group(1)
    state = None
    for end in range(len(raw), max(0, len(raw) - 200), -1):
        try:
            state = json.loads(raw[:end])
            break
        except json.JSONDecodeError:
            continue

    if not state:
        return {}

    biz = state.get("blogHome", {}).get("blogBusinessInfo", {}).get(blog_id, {}).get("data", {})
    if not biz.get("existBusinessInfo"):
        return {}

    bv = biz.get("businessView", {})
    return _normalize_business_view(bv) if bv else {}


async def fetch_blog_profile(blog_id: str) -> dict:
    """모바일 블로그 메인에서 프로필 소개·프로필 이미지·블로그 제목을 추출한다.

    소개글: DOM ``p.desc__Sxw5t`` (전체 텍스트) → 폴백 og:description
    프로필 이미지: ``img[src*="blogpfthumb"]`` → 폴백 og:image
    블로그 제목: og:title (``" : 네이버 블로그"`` 접미사 제거)

    Returns:
        {"profile_intro": str, "blog_title": str, "profile_image_url": str}
    """
    url = f"https://m.blog.naver.com/{blog_id}"
    mobile_ua = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"}
    client = _get_client()
    try:
        resp = await client.get(url, headers=mobile_ua)
        resp.raise_for_status()
    except Exception:
        log.warning("블로그 프로필 가져오기 실패: %s", blog_id)
        return {"profile_intro": "", "blog_title": "", "profile_image_url": ""}

    soup = BeautifulSoup(resp.text, "html.parser")

    # 소개글: DOM 직접 파싱 (잘리지 않는 전체 텍스트) → og:description 폴백
    desc_el = soup.select_one("p.desc__Sxw5t")
    if not desc_el:
        desc_el = soup.select_one("div.intro_text") or soup.select_one("p.desc")
    if desc_el:
        profile_intro = desc_el.get_text(separator="\n", strip=True)
    else:
        og_desc = soup.select_one('meta[property="og:description"]')
        profile_intro = og_desc["content"].strip() if og_desc and og_desc.get("content") else ""
        if profile_intro:
            log.debug("프로필 소개 og:description 폴백 (잘림 가능): %s", blog_id)

    # 블로그 제목
    og_title = soup.select_one('meta[property="og:title"]')
    blog_title = og_title["content"].strip() if og_title and og_title.get("content") else ""
    if blog_title.endswith(" : 네이버 블로그"):
        blog_title = blog_title[:-len(" : 네이버 블로그")]

    # 프로필 이미지: blogpfthumb img (블로거가 설정한 프로필 사진) → og:image 폴백
    pf_img = soup.select_one('img[src*="blogpfthumb"]')
    if pf_img and pf_img.get("src"):
        profile_image_url = pf_img["src"]
    else:
        og_img = soup.select_one('meta[property="og:image"]')
        profile_image_url = og_img["content"].strip() if og_img and og_img.get("content") else ""

    # 배너 이미지: 모바일 blog_cover 배경 이미지 (데스크톱 CSS 폴백용)
    banner_image_url = ""
    cover_el = soup.select_one('div[class*="blog_cover"]')
    if cover_el:
        style = cover_el.get("style", "")
        m = re.search(r"background-image\s*:\s*url\(([^)]+)\)", style)
        if m and "pstatic.net" in m.group(1):
            banner_image_url = m.group(1)

    # 사업자정보: __INITIAL_STATE__ JSON에서 추출 (API 폴백용)
    business_info_html = _parse_business_info_from_html(resp.text, blog_id)

    return {
        "profile_intro": profile_intro,
        "blog_title": blog_title,
        "profile_image_url": profile_image_url,
        "banner_image_url": banner_image_url,
        "business_info_html": business_info_html,
    }


# #blog-title CSS에서 배너 이미지 URL 추출 패턴
_BANNER_RE = re.compile(r"#blog-title\s*\{[^}]*?url\(([^)]+)\)")


async def fetch_blog_banner(blog_id: str) -> str:
    """데스크톱 블로그 메인의 커스텀 배너 이미지 URL을 추출한다.

    PostList iframe의 CSS #blog-title background-image에서 추출.
    배너가 없는 블로그는 빈 문자열을 반환한다.
    """
    url = (
        f"https://blog.naver.com/PostList.naver"
        f"?blogId={blog_id}&widgetTypeCall=true&noTrackingCode=true&directAccess=true"
    )
    client = _get_client()
    try:
        resp = await client.get(url)
        resp.raise_for_status()
    except Exception:
        log.warning("블로그 배너 가져오기 실패: %s", blog_id)
        return ""

    match = _BANNER_RE.search(resp.text)
    if not match:
        return ""

    banner_url = match.group(1)
    # pstatic.net 도메인이 아니면 기본 스킨 이미지이므로 무시
    if "pstatic.net" not in banner_url:
        return ""

    return banner_url


def _normalize_business_view(bv: dict) -> dict:
    """businessView 원시 응답을 정규화된 dict로 변환한다."""
    raw_phone = bv.get("phone", "")
    return {
        "business_name": bv.get("businessName", ""),
        "representative": bv.get("ceo", ""),
        "address": bv.get("address", ""),
        "phone": raw_phone.replace("-", "").replace(".", "").replace(" ", "") if raw_phone else "",
        "email": bv.get("email", ""),
        "business_number": bv.get("businessLicenseNo", ""),
    }


async def fetch_business_info(blog_id: str, html_fallback: dict | None = None) -> dict:
    """네이버 인증 사업자정보를 조회한다 (API → HTML 폴백).

    html_fallback: fetch_blog_profile()에서 미리 파싱한 사업자정보 dict.
    등록된 블로그만 데이터를 반환하며, 미등록 시 빈 dict.
    """
    # 1차: 전용 API
    url = f"https://m.blog.naver.com/api/blogs/{blog_id}/business-info"
    headers = {
        "Referer": f"https://m.blog.naver.com/{blog_id}",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
    }
    client = _get_client()
    try:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        if data.get("isSuccess") and data.get("result", {}).get("existBusinessInfo"):
            return _normalize_business_view(data["result"]["businessView"])
    except Exception:
        pass

    # 2차: HTML 폴백 (fetch_blog_profile에서 미리 파싱된 결과)
    if html_fallback:
        log.debug("사업자정보 HTML 폴백 사용: %s", blog_id)
        return html_fallback

    return {}


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
    client = _get_client()
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
# 인스타그램: URL 또는 "인스타 : 아이디" 형태
_INSTA_RE = re.compile(
    r"instagram\.com/([a-zA-Z0-9_.]+)"
    r"|인스타(?:그램)?[\s:：]+@?([a-zA-Z0-9_.]+)",
    re.IGNORECASE,
)
# 유튜브: URL 또는 "유튜브 : 채널명" 형태
_YOUTUBE_RE = re.compile(
    r"youtube\.com/(?:@|channel/|c/)?([a-zA-Z0-9_.\-가-힣]+)"
    r"|유튜브[\s:：]+@?([a-zA-Z0-9_.\-가-힣]+)",
    re.IGNORECASE,
)


def extract_contact_info(text: str) -> dict:
    """텍스트에서 연락처, 이메일, 인스타, 유튜브 계정을 추출한다."""
    phones = _PHONE_RE.findall(text)
    emails = _EMAIL_RE.findall(text)
    # 인스타: 두 그룹 중 매칭된 것 사용
    insta_matches = _INSTA_RE.findall(text)
    insta = next((g1 or g2 for g1, g2 in insta_matches), "") if insta_matches else ""
    # 유튜브: 두 그룹 중 매칭된 것 사용
    yt_matches = _YOUTUBE_RE.findall(text)
    youtube = next((g1 or g2 for g1, g2 in yt_matches), "") if yt_matches else ""
    return {
        "phone": phones[0].replace("-", "").replace(".", "").replace(" ", "") if phones else "",
        "email": emails[0] if emails else "",
        "instagram": insta,
        "youtube": youtube,
    }


async def explore_blogger(blog_url: str) -> dict:
    """블로거의 프로필 + 배너 + 여러 글을 종합하여 업체 정보를 수집한다.

    정보 수집 순서:
    1. 블로그 프로필 (모바일 DOM) — 소개글·프로필 이미지·블로그 제목
    2. 블로그 메인 배너 (데스크톱 #blog-title CSS) — 대표 이미지
    3. 검색 결과 게시글 — 시공 사례
    4. RSS 최근 글 탐색 — 연락처/추가 정보
    """
    blog_id = extract_blog_id(blog_url)
    if not blog_id:
        post = await fetch_blog_post(blog_url)
        contact = extract_contact_info(post["about"])
        return {
            **post, **contact,
            "profile_intro": "",
            "blog_title": "",
            "blog_home_url": "",
            "banner_image_url": "",
            "profile_image_url": "",
            "source_urls": [blog_url],
        }

    blog_home_url = f"https://blog.naver.com/{blog_id}"

    # 1-3. 프로필·배너·게시글을 병렬 수집 (독립적 요청)
    profile, banner_image_url, main_post = await asyncio.gather(
        fetch_blog_profile(blog_id),
        fetch_blog_banner(blog_id),
        fetch_blog_post(blog_url),
    )

    # 4. 사업자정보: API 시도 → 실패 시 profile에서 파싱한 HTML 폴백 사용
    biz_info = await fetch_business_info(
        blog_id, html_fallback=profile.get("business_info_html"),
    )
    source_urls = [blog_url]

    # 연락처 추출: 소개글 → 게시글 본문 → RSS 최근 글 순 폴백
    contact = extract_contact_info(profile["profile_intro"])
    phone_source = "profile" if contact["phone"] else ""

    # 소개글에서 못 찾은 필드를 게시글 본문에서 보충
    post_contact = extract_contact_info(main_post["about"])
    for key in ("phone", "email", "instagram", "youtube"):
        if not contact[key] and post_contact[key]:
            contact[key] = post_contact[key]
            if key == "phone":
                phone_source = "post"

    # 아직 연락처 부족하면 RSS 최근 글에서 보충 (병렬 fetch)
    if not contact["phone"] and not contact["email"]:
        other_urls = await fetch_blogger_posts(blog_id, count=20)
        other_urls = [u for u in other_urls if u != blog_url]

        async def _safe_fetch(u: str) -> tuple[str, dict | None]:
            try:
                return u, await fetch_blog_post(u)
            except Exception:
                return u, None

        rss_results = await asyncio.gather(*(_safe_fetch(u) for u in other_urls))
        for url, post in rss_results:
            if post is None:
                continue
            rss_contact = extract_contact_info(post["about"])
            for key in ("phone", "email", "instagram", "youtube"):
                if not contact[key] and rss_contact[key]:
                    contact[key] = rss_contact[key]
                    if key == "phone":
                        phone_source = "post"
            if contact["phone"] or contact["email"]:
                source_urls.append(url)
                log.info("연락처 발견 (RSS 폴백): %s → %s", url, rss_contact)
                break

    if biz_info:
        log.info("사업자정보 발견: %s (%s)", biz_info.get("business_name"), blog_id)

    return {
        "about": main_post["about"],
        "profile_intro": profile["profile_intro"],
        "blog_title": profile["blog_title"],
        "blog_home_url": blog_home_url,
        "blogger_name": main_post["blogger_name"],
        "banner_image_url": banner_image_url or profile.get("banner_image_url", ""),
        "profile_image_url": profile["profile_image_url"],
        "cover_image_url": main_post["cover_image_url"],
        "source_urls": source_urls,
        "phone_source": phone_source,  # "profile" | "post" | ""
        "business_info": biz_info,  # 네이버 인증 사업자정보 (빈 dict이면 미등록)
        **contact,
    }


def build_search_queries(keywords: list[str] | None = None) -> list[str]:
    """검색 키워드 × 쿼리 템플릿으로 검색 쿼리 목록을 생성한다."""
    from crawler.models import SEARCH_KEYWORDS

    keywords = keywords or SEARCH_KEYWORDS
    templates = ["{kw} 시공업체 수도권", "{kw} 시공 전문 서울 경기"]
    return [t.format(kw=kw) for kw in keywords for t in templates]
