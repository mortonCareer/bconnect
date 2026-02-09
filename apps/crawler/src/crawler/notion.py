"""노션 DB 싱크 — 중복 체크 + 레코드 생성."""

from notion_client import AsyncClient

from crawler.config import settings
from crawler.models import Technician

notion = AsyncClient(auth=settings.notion_token)


async def find_duplicate(tech: Technician) -> str | None:
    """중복 레코드가 있으면 page_id를 반환한다.

    우선순위: 사업자등록번호 > 연락처 > 이메일
    """
    db_id = settings.notion_database_id

    for prop, value in [
        ("사업자등록번호", tech.business_number),
        ("연락처", tech.phone),
        ("이메일", tech.email),
    ]:
        if not value:
            continue

        results = await notion.databases.query(
            database_id=db_id,
            filter={"property": prop, "rich_text": {"equals": value}}
            if prop == "사업자등록번호"
            else {"property": prop, "phone_number": {"equals": value}}
            if prop == "연락처"
            else {"property": prop, "email": {"equals": value}},
        )

        if results["results"]:
            return results["results"][0]["id"]

    return None


async def save_technician(tech: Technician) -> str:
    """기술자 레코드를 노션 DB에 저장하고 page_id를 반환한다.

    중복이 있으면 저장하지 않고 기존 page_id를 반환한다.
    """
    existing = await find_duplicate(tech)
    if existing:
        return existing

    # 페이지 본문: 한줄소개 + 소개 + 출처
    body_parts = []
    if tech.headline:
        body_parts.append(f"## 한줄소개\n{tech.headline}")
    if tech.about:
        body_parts.append(f"## 소개\n{tech.about}")
    if tech.source_urls:
        body_parts.append("---\n출처: " + ", ".join(tech.source_urls))
    body_markdown = "\n\n".join(body_parts)

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

    page = await notion.pages.create(
        parent={"database_id": settings.notion_database_id},
        properties=properties,
        children=_markdown_to_blocks(body_markdown),
        **({"cover": {"type": "external", "external": {"url": tech.cover_image_url}}} if tech.cover_image_url else {}),
    )

    return page["id"]


def _markdown_to_blocks(md: str) -> list[dict]:
    """간단한 마크다운을 노션 블록으로 변환한다."""
    blocks = []
    for line in md.split("\n"):
        if line.startswith("## "):
            blocks.append({
                "object": "block",
                "type": "heading_2",
                "heading_2": {"rich_text": [{"text": {"content": line[3:]}}]},
            })
        elif line.startswith("---"):
            blocks.append({"object": "block", "type": "divider", "divider": {}})
        elif line.strip():
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {"rich_text": [{"text": {"content": line}}]},
            })
    return blocks
