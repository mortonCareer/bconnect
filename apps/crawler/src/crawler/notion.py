"""노션 DB 싱크 — 중복 체크 + 레코드 생성/업데이트."""

import logging

from notion_client import AsyncClient

from crawler.config import settings
from crawler.models import Technician

log = logging.getLogger(__name__)

notion = AsyncClient(auth=settings.notion_token, notion_version="2022-06-28")


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

    return properties


def _build_body_markdown(tech: Technician) -> str:
    """Technician → 페이지 본문 마크다운 변환."""
    body_parts = []
    if tech.headline:
        body_parts.append(tech.headline)
    if tech.source_urls:
        body_parts.append("출처: " + ", ".join(tech.source_urls))
    return "\n\n".join(body_parts)


async def save_technician(tech: Technician) -> str:
    """기술자 레코드를 노션 DB에 저장하고 page_id를 반환한다.

    중복이 있으면 업데이트하고 기존 page_id를 반환한다.
    """
    existing = await find_duplicate(tech)
    if existing:
        await update_technician(existing, tech)
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


async def update_technician(page_id: str, tech: Technician) -> None:
    """기존 레코드를 보강(enrich) 방식으로 업데이트한다.

    - 빈 필드만 새 데이터로 채운다
    - 채널(multi_select)은 누적한다
    - 본문(소개글)은 새 데이터가 더 길면 교체한다
    """
    page = await notion.pages.retrieve(page_id=page_id)
    existing = page["properties"]

    # 채널 누적: 기존 채널 + 새 채널 (중복 제거)
    existing_channels = _read_prop(existing, "채널")
    if isinstance(existing_channels, list):
        merged_channels = list(dict.fromkeys(existing_channels + tech.channels))
        tech = tech.model_copy(update={"channels": merged_channels})

    # 빈 필드만 새 값으로 채우는 속성 빌드
    new_properties = _build_properties(tech)
    enrich_properties = {}

    for prop_name, new_val in new_properties.items():
        old_val = _read_prop(existing, prop_name)
        # 누적 필드: 채널
        if prop_name == "채널":
            enrich_properties[prop_name] = new_val
            continue
        # 기존 값이 비어있으면 새 값으로 채움
        if not old_val:
            enrich_properties[prop_name] = new_val

    cover = {}
    existing_cover = page.get("cover")
    if not existing_cover and tech.cover_image_url:
        cover = {"cover": {"type": "external", "external": {"url": tech.cover_image_url}}}

    if enrich_properties or cover:
        await notion.pages.update(page_id=page_id, properties=enrich_properties, **cover)

    # 본문: 새 소개글이 기존보다 길면 교체
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
        if len(new_text) > len(existing_text):
            for block in existing_blocks["results"]:
                try:
                    await notion.blocks.delete(block_id=block["id"])
                except Exception:
                    log.debug("블록 삭제 실패 (무시): %s", block["id"])
            await notion.blocks.children.append(block_id=page_id, children=new_blocks)

    log.info("노션 레코드 보강: %s → %s", tech.name, page_id)


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
