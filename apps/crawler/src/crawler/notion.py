"""노션 DB 싱크 — 중복 체크 + 레코드 생성/업데이트."""

import logging

from notion_client import AsyncClient

from crawler.config import settings
from crawler.models import Technician

log = logging.getLogger(__name__)

notion = AsyncClient(auth=settings.notion_token, notion_version="2022-06-28")


async def find_duplicate(tech: Technician) -> str | None:
    """중복 레코드가 있으면 page_id를 반환한다.

    우선순위: 사업자등록번호 > 연락처 > 이메일
    """
    db_id = settings.notion_database_id

    filters = [
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
        body_parts.append(f"## 한줄소개\n{tech.headline}")
    if tech.about:
        body_parts.append(f"## 소개\n{tech.about}")
    if tech.source_urls:
        body_parts.append("---\n출처: " + ", ".join(tech.source_urls))
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


async def update_technician(page_id: str, tech: Technician) -> None:
    """기존 노션 페이지의 속성과 본문을 업데이트한다."""
    properties = _build_properties(tech)
    cover = (
        {"cover": {"type": "external", "external": {"url": tech.cover_image_url}}}
        if tech.cover_image_url else {}
    )

    await notion.pages.update(page_id=page_id, properties=properties, **cover)

    # 기존 블록 삭제 후 새 블록 추가
    existing_blocks = await notion.blocks.children.list(block_id=page_id)
    for block in existing_blocks["results"]:
        try:
            await notion.blocks.delete(block_id=block["id"])
        except Exception:
            log.debug("블록 삭제 실패 (무시): %s", block["id"])

    body_markdown = _build_body_markdown(tech)
    new_blocks = _markdown_to_blocks(body_markdown)
    if new_blocks:
        await notion.blocks.children.append(block_id=page_id, children=new_blocks)

    log.info("노션 레코드 업데이트: %s → %s", tech.name, page_id)


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
