"""노션 DB 싱크 — 중복 체크 + 레코드 생성/업데이트."""

import asyncio
import logging
from datetime import datetime, timezone

import httpx
from notion_client import AsyncClient

from crawler.config import settings
from crawler.models import Technician

log = logging.getLogger(__name__)

MAX_RETRIES = 3
BASE_DELAY = 1.0  # 초


class _RetryTransport(httpx.AsyncHTTPTransport):
    """429 응답 시 지수 백오프로 재시도하는 httpx 트랜스포트."""

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        for attempt in range(MAX_RETRIES + 1):
            response = await super().handle_async_request(request)
            if response.status_code != 429 or attempt == MAX_RETRIES:
                return response
            retry_after = float(response.headers.get("Retry-After", BASE_DELAY * (2 ** attempt)))
            log.warning("노션 429 — %.1f초 후 재시도 (%d/%d)", retry_after, attempt + 1, MAX_RETRIES)
            await asyncio.sleep(retry_after)
        return response  # unreachable but satisfies type checker


notion = AsyncClient(
    auth=settings.notion_token,
    notion_version="2022-06-28",
    client=httpx.AsyncClient(transport=_RetryTransport()),
)


async def find_duplicate(tech: Technician) -> str | None:
    """중복 레코드가 있으면 page_id를 반환한다.

    우선순위: 자세히보기(URL/blog_id) > 사업자등록번호 > 연락처 > 이메일
    """
    db_id = settings.notion_database_id

    filters = [
        ("자세히보기", tech.detail_url, {"property": "자세히보기", "url": {"equals": tech.detail_url}}),
        ("사업자등록번호", tech.business_number, {"property": "사업자등록번호", "rich_text": {"equals": tech.business_number}}),
        ("연락처", tech.phone, {"property": "연락처", "phone_number": {"equals": tech.phone}}),
        ("이메일", tech.email, {"property": "이메일", "email": {"equals": tech.email}}),
    ]

    for _prop, value, filt in filters:
        if not value:
            continue

        results = await notion.request(
            path=f"databases/{db_id}/query",
            method="POST",
            body={"filter": filt},
        )

        if results["results"]:
            return results["results"][0]["id"]

    return None


async def find_pages_missing_phone() -> list[dict]:
    """연락처가 비어있는 레코드를 모두 가져온다. (page_id, detail_url, name)"""
    db_id = settings.notion_database_id
    pages: list[dict] = []
    start_cursor = None
    while True:
        body: dict = {
            "filter": {"property": "연락처", "phone_number": {"is_empty": True}},
            "page_size": 100,
        }
        if start_cursor:
            body["start_cursor"] = start_cursor
        results = await notion.request(
            path=f"databases/{db_id}/query",
            method="POST",
            body=body,
        )
        for page in results["results"]:
            props = page["properties"]
            detail_url = _read_prop(props, "자세히보기")
            name = _read_prop(props, "업체명")
            pages.append({"page_id": page["id"], "detail_url": detail_url, "name": name})
        if not results.get("has_more"):
            break
        start_cursor = results["next_cursor"]
    return pages


async def find_duplicate_by_url(url: str) -> str | None:
    """URL(자세히보기)로만 중복 체크한다. 크롤링 전 빠른 스킵용."""
    if not url:
        return None
    results = await notion.request(
        path=f"databases/{settings.notion_database_id}/query",
        method="POST",
        body={"filter": {"property": "자세히보기", "url": {"equals": url}}},
    )
    return results["results"][0]["id"] if results["results"] else None


async def update_phone(page_id: str, phone: str) -> None:
    """연락처만 업데이트한다."""
    await notion.pages.update(
        page_id=page_id,
        properties={
            "연락처": {"phone_number": phone},
            "마지막 싱크": {"date": {"start": datetime.now(timezone.utc).isoformat()}},
        },
    )


async def touch_synced_at(page_id: str) -> None:
    """마지막 싱크 시점만 갱신한다. 크롤링/LLM 비용 없이 타임스탬프만 업데이트."""
    await notion.pages.update(
        page_id=page_id,
        properties={"마지막 싱크": {"date": {"start": datetime.now(timezone.utc).isoformat()}}},
    )


def _build_properties(tech: Technician) -> dict:
    """Technician → 노션 DB 속성 dict 변환."""
    properties: dict = {
        "업체명": {"title": [{"text": {"content": tech.name}}]},
        "구분": {"select": {"name": tech.rank}},
        "시공분야": {"multi_select": [{"name": t} for t in tech.trades]},
        "채널": {"multi_select": [{"name": c} for c in tech.channels]},
    }

    if tech.representative:
        properties["대표자"] = {"rich_text": [{"text": {"content": tech.representative}}]}
    if tech.region:
        properties["지역"] = {"select": {"name": tech.region}}
    if tech.address:
        properties["주소"] = {"rich_text": [{"text": {"content": tech.address}}]}
    if tech.phone:
        properties["연락처"] = {"phone_number": tech.phone}
    if tech.email:
        properties["이메일"] = {"email": tech.email}
    if tech.business_number:
        properties["사업자등록번호"] = {"rich_text": [{"text": {"content": tech.business_number}}]}
    if tech.experience is not None:
        properties["경력"] = {"number": tech.experience}
    if tech.credentials:
        properties["인증"] = {"multi_select": [{"name": c} for c in tech.credentials]}
    if tech.detail_url:
        properties["자세히보기"] = {"url": tech.detail_url}

    properties["마지막 싱크"] = {"date": {"start": datetime.now(timezone.utc).isoformat()}}

    return properties


def _build_body_markdown(tech: Technician) -> str:
    """Technician → 페이지 본문 마크다운 변환."""
    body_parts = []
    if tech.headline:
        body_parts.append(tech.headline)
    if tech.source_urls:
        body_parts.append("출처: " + ", ".join(tech.source_urls))
    return "\n\n".join(body_parts)


async def save_technician(tech: Technician, force: bool = False) -> str:
    """기술자 레코드를 노션 DB에 저장하고 page_id를 반환한다.

    중복이 있으면 업데이트하고 기존 page_id를 반환한다.
    force=True면 기존 필드를 덮어쓴다.
    """
    existing = await find_duplicate(tech)
    if existing:
        await update_technician(existing, tech, force=force)
        return existing

    properties = _build_properties(tech)
    body_markdown = _build_body_markdown(tech)

    page = await notion.pages.create(
        parent={"database_id": settings.notion_database_id},
        properties=properties,
        children=_markdown_to_blocks(body_markdown),
        **({"cover": {"type": "external", "external": {"url": tech.cover_image_url}}} if tech.cover_image_url else {}),
    )

    return page["id"]


def _read_prop(props: dict, name: str) -> str:
    """노션 속성에서 값을 문자열로 읽는다."""
    prop = props.get(name, {})
    ptype = prop.get("type", "")
    if ptype == "title":
        return prop["title"][0]["plain_text"] if prop.get("title") else ""
    if ptype == "rich_text":
        return prop["rich_text"][0]["plain_text"] if prop.get("rich_text") else ""
    if ptype == "select":
        return prop["select"]["name"] if prop.get("select") else ""
    if ptype == "multi_select":
        return [s["name"] for s in prop.get("multi_select", [])]
    if ptype == "phone_number":
        return prop.get("phone_number") or ""
    if ptype == "email":
        return prop.get("email") or ""
    if ptype == "url":
        return prop.get("url") or ""
    if ptype == "number":
        return prop.get("number")
    return ""


async def update_technician(page_id: str, tech: Technician, force: bool = False) -> None:
    """기존 레코드를 업데이트한다.

    - force=False (기본): 빈 필드만 새 데이터로 채운다 (enrichment)
    - force=True: 모든 필드를 새 데이터로 덮어쓴다
    - 채널(multi_select)은 항상 누적한다
    """
    page = await notion.pages.retrieve(page_id=page_id)
    existing = page["properties"]

    # 채널 누적: 기존 채널 + 새 채널 (중복 제거)
    existing_channels = _read_prop(existing, "채널")
    if isinstance(existing_channels, list):
        merged_channels = list(dict.fromkeys(existing_channels + tech.channels))
        tech = tech.model_copy(update={"channels": merged_channels})

    new_properties = _build_properties(tech)

    if force:
        # force 모드: 모든 필드 덮어쓰기
        update_properties = new_properties
    else:
        # enrichment 모드: 빈 필드만 채우기
        update_properties = {}
        for prop_name, new_val in new_properties.items():
            old_val = _read_prop(existing, prop_name)
            if prop_name in ("채널", "마지막 싱크"):
                update_properties[prop_name] = new_val
                continue
            if not old_val:
                update_properties[prop_name] = new_val

    cover = {}
    existing_cover = page.get("cover")
    if (force or not existing_cover) and tech.cover_image_url:
        cover = {"cover": {"type": "external", "external": {"url": tech.cover_image_url}}}

    if update_properties or cover:
        await notion.pages.update(page_id=page_id, properties=update_properties, **cover)

    # 본문: force면 항상 교체, 아니면 새 소개글이 더 길 때만
    body_markdown = _build_body_markdown(tech)
    new_blocks = _markdown_to_blocks(body_markdown)
    if new_blocks:
        existing_blocks = await notion.blocks.children.list(block_id=page_id)
        existing_text = " ".join(
            b.get(b["type"], {}).get("rich_text", [{}])[0].get("plain_text", "")
            for b in existing_blocks["results"]
            if b["type"] in ("paragraph", "heading_2")
        )
        new_text = tech.headline or ""
        should_replace = force or len(new_text) > len(existing_text)
        if should_replace:
            for block in existing_blocks["results"]:
                try:
                    await notion.blocks.delete(block_id=block["id"])
                except Exception:
                    log.debug("블록 삭제 실패 (무시): %s", block["id"])
            await notion.blocks.children.append(block_id=page_id, children=new_blocks)

    mode = "덮어쓰기" if force else "보강"
    log.info("노션 레코드 %s: %s → %s", mode, tech.name, page_id)


def _markdown_to_blocks(md: str, max_blocks: int = 95) -> list[dict]:
    """간단한 마크다운을 노션 블록으로 변환한다 (최대 100블록 제한)."""
    blocks = []
    for line in md.split("\n"):
        if len(blocks) >= max_blocks:
            break
        if line.startswith("## "):
            blocks.append({
                "object": "block",
                "type": "heading_2",
                "heading_2": {"rich_text": [{"text": {"content": line[3:]}}]},
            })
        elif line.startswith("---"):
            blocks.append({"object": "block", "type": "divider", "divider": {}})
        elif line.strip():
            # 노션 rich_text 최대 2000자
            content = line[:2000]
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {"rich_text": [{"text": {"content": content}}]},
            })
    return blocks
