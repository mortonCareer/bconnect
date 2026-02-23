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


# 코드에서 사용하는 노션 DB 프로퍼티 → 타입 매핑
REQUIRED_PROPERTIES: dict[str, str] = {
    "업체명": "title",
    "구분": "select",
    "시공분야": "multi_select",
    "채널": "multi_select",
    "대표자": "rich_text",
    "지역": "select",
    "주소": "rich_text",
    "연락처": "phone_number",
    "이메일": "email",
    "사업자등록번호": "rich_text",
    "경력": "number",
    "인증": "multi_select",
    "자세히보기": "url",
    "최종 수집 일시": "date",
}


async def validate_schema() -> list[str]:
    """노션 DB 스키마를 검증하고 문제가 있는 프로퍼티 목록을 반환한다."""
    db = await notion.databases.retrieve(database_id=settings.notion_database_id)
    db_props = db["properties"]

    errors = []
    for name, expected_type in REQUIRED_PROPERTIES.items():
        if name not in db_props:
            errors.append(f"'{name}' 프로퍼티 없음")
        elif db_props[name]["type"] != expected_type:
            errors.append(f"'{name}' 타입 불일치 (기대: {expected_type}, 실제: {db_props[name]['type']})")

    return errors


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


async def find_pages_needing_enrichment() -> list[dict]:
    """빈 필드가 1개 이상인 레코드를 조회한다. (page_id, detail_url, name, empty_fields)"""
    db_id = settings.notion_database_id
    pages: list[dict] = []
    start_cursor = None
    while True:
        body: dict = {
            "filter": {"or": [
                {"property": "연락처", "phone_number": {"is_empty": True}},
                {"property": "주소", "rich_text": {"is_empty": True}},
                {"property": "이메일", "email": {"is_empty": True}},
                {"property": "대표자", "rich_text": {"is_empty": True}},
                {"property": "사업자등록번호", "rich_text": {"is_empty": True}},
            ]},
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
            empty_fields = []
            if not _read_prop(props, "연락처"):
                empty_fields.append("연락처")
            if not _read_prop(props, "주소"):
                empty_fields.append("주소")
            if not _read_prop(props, "이메일"):
                empty_fields.append("이메일")
            if not _read_prop(props, "대표자"):
                empty_fields.append("대표자")
            if not _read_prop(props, "사업자등록번호"):
                empty_fields.append("사업자등록번호")
            pages.append({
                "page_id": page["id"], "detail_url": detail_url,
                "name": name, "empty_fields": empty_fields,
            })
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
            "최종 수집 일시": {"date": {"start": datetime.now(timezone.utc).isoformat()}},
        },
    )


async def touch_synced_at(page_id: str) -> None:
    """최종 수집 일시 시점만 갱신한다. 크롤링/LLM 비용 없이 타임스탬프만 업데이트."""
    await notion.pages.update(
        page_id=page_id,
        properties={"최종 수집 일시": {"date": {"start": datetime.now(timezone.utc).isoformat()}}},
    )


def _build_properties(tech: Technician) -> dict:
    """Technician → 노션 DB 속성 dict 변환."""
    properties: dict = {
        "업체명": {"title": [{"text": {"content": tech.name}}]},
        "시공분야": {"multi_select": [{"name": t} for t in tech.trades]},
        "채널": {"multi_select": [{"name": c} for c in tech.channels]},
    }
    if tech.rank:
        properties["구분"] = {"select": {"name": tech.rank}}

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

    properties["최종 수집 일시"] = {"date": {"start": datetime.now(timezone.utc).isoformat()}}

    return properties


REVIEW_REQUIRED_PROPERTIES: dict[str, str] = {
    **REQUIRED_PROPERTIES,
    "상태": "status",
    "거절사유": "rich_text",
}


def _build_review_properties(tech: Technician, review_status: str = "대기중") -> dict:
    """Technician → 검수 DB 속성 dict 변환. 프로덕션 속성 + 검수."""
    properties = _build_properties(tech)
    properties["상태"] = {"status": {"name": review_status}}
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
            if prop_name in ("채널", "최종 수집 일시"):
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


# ── 검수 DB 함수 ──────────────────────────────────────────────


async def find_review_duplicate(tech: Technician) -> str | None:
    """검수 DB에서 중복 레코드를 찾는다. detail_url 기준."""
    review_db_id = settings.notion_review_database_id
    if not review_db_id or not tech.detail_url:
        return None

    results = await notion.request(
        path=f"databases/{review_db_id}/query",
        method="POST",
        body={"filter": {"property": "자세히보기", "url": {"equals": tech.detail_url}}},
    )
    return results["results"][0]["id"] if results["results"] else None


async def save_to_review(tech: Technician) -> str:
    """기술자 레코드를 검수 DB에 저장하고 page_id를 반환한다.

    중복이 있으면 업데이트하고 기존 page_id를 반환한다.
    새 레코드는 검수=대기중으로 생성된다.
    """
    review_db_id = settings.notion_review_database_id

    existing = await find_review_duplicate(tech)
    if existing:
        await update_technician(existing, tech, force=False)
        return existing

    properties = _build_review_properties(tech, review_status="대기중")
    body_markdown = _build_body_markdown(tech)

    page = await notion.pages.create(
        parent={"database_id": review_db_id},
        properties=properties,
        children=_markdown_to_blocks(body_markdown),
        **({"cover": {"type": "external", "external": {"url": tech.cover_image_url}}} if tech.cover_image_url else {}),
    )

    return page["id"]


async def validate_review_schema() -> list[str]:
    """검수 DB 스키마를 검증하고 문제가 있는 프로퍼티 목록을 반환한다."""
    review_db_id = settings.notion_review_database_id
    if not review_db_id:
        return ["NOTION_REVIEW_DATABASE_ID가 설정되지 않았습니다"]

    db = await notion.databases.retrieve(database_id=review_db_id)
    db_props = db["properties"]

    errors = []
    for name, expected_type in REVIEW_REQUIRED_PROPERTIES.items():
        if name not in db_props:
            errors.append(f"검수 DB: '{name}' 프로퍼티 없음")
        elif db_props[name]["type"] != expected_type:
            errors.append(f"검수 DB: '{name}' 타입 불일치 (기대: {expected_type}, 실제: {db_props[name]['type']})")

    return errors


def _review_page_to_technician(props: dict) -> Technician:
    """검수 DB 페이지 속성을 Technician 모델로 변환한다."""
    trades = _read_prop(props, "시공분야")
    if not isinstance(trades, list):
        trades = [trades] if trades else []

    channels = _read_prop(props, "채널")
    if not isinstance(channels, list):
        channels = [channels] if channels else []

    credentials = _read_prop(props, "인증")
    if not isinstance(credentials, list):
        credentials = [credentials] if credentials else []

    return Technician(
        name=_read_prop(props, "업체명") or "이름 없음",
        representative=_read_prop(props, "대표자") or "",
        rank=_read_prop(props, "구분") or "",
        trades=trades,
        region=_read_prop(props, "지역") or "",
        address=_read_prop(props, "주소") or "",
        phone=_read_prop(props, "연락처") or "",
        email=_read_prop(props, "이메일") or "",
        business_number=_read_prop(props, "사업자등록번호") or "",
        experience=_read_prop(props, "경력"),
        credentials=credentials,
        detail_url=_read_prop(props, "자세히보기") or "",
        channels=channels,
    )


async def find_all_review_pages() -> list[dict]:
    """검수 DB 전체 레코드를 가져온다. (패치/마이그레이션용)"""
    review_db_id = settings.notion_review_database_id
    pages: list[dict] = []
    start_cursor = None

    while True:
        body: dict = {"page_size": 100}
        if start_cursor:
            body["start_cursor"] = start_cursor

        results = await notion.request(
            path=f"databases/{review_db_id}/query",
            method="POST",
            body=body,
        )

        for page in results["results"]:
            pages.append({
                "page_id": page["id"],
                "properties": page["properties"],
            })

        if not results.get("has_more"):
            break
        start_cursor = results["next_cursor"]

    return pages


async def patch_review_page(page_id: str, properties: dict) -> None:
    """검수 DB 페이지의 속성만 업데이트한다. (패치용)"""
    await notion.pages.update(page_id=page_id, properties=properties)


async def read_page_blocks(page_id: str) -> list[dict]:
    """페이지의 블록(본문)을 읽어온다."""
    result = await notion.blocks.children.list(block_id=page_id)
    return result["results"]


async def update_block_text(block_id: str, new_text: str) -> None:
    """paragraph 블록의 텍스트를 교체한다."""
    await notion.blocks.update(
        block_id=block_id,
        paragraph={"rich_text": [{"text": {"content": new_text[:2000]}}]},
    )


async def find_approved() -> list[dict]:
    """검수 DB에서 상태=승인인 레코드를 모두 가져온다."""
    review_db_id = settings.notion_review_database_id
    pages: list[dict] = []
    start_cursor = None

    while True:
        body: dict = {
            "filter": {"property": "상태", "status": {"equals": "승인"}},
            "page_size": 100,
        }
        if start_cursor:
            body["start_cursor"] = start_cursor

        results = await notion.request(
            path=f"databases/{review_db_id}/query",
            method="POST",
            body=body,
        )

        for page in results["results"]:
            pages.append({
                "page_id": page["id"],
                "properties": page["properties"],
                "cover": page.get("cover"),
            })

        if not results.get("has_more"):
            break
        start_cursor = results["next_cursor"]

    return pages


async def move_to_production(review_page: dict) -> tuple[str, str]:
    """검수 DB 승인 건을 프로덕션 DB로 복사한다.

    Returns:
        (page_id, status) — status는 "created" | "updated"
    """
    props = review_page["properties"]
    tech = _review_page_to_technician(props)

    # 검수 DB 페이지 본문 블록 읽기
    review_page_id = review_page["page_id"]
    blocks_result = await notion.blocks.children.list(block_id=review_page_id)
    body_blocks = []
    for block in blocks_result["results"]:
        btype = block["type"]
        if btype in ("paragraph", "heading_2", "divider"):
            body_blocks.append({
                "object": "block",
                "type": btype,
                btype: block[btype],
            })

    # 커버 이미지
    cover = review_page.get("cover")
    if cover and cover.get("type") == "external":
        tech = tech.model_copy(update={"cover_image_url": cover["external"]["url"]})

    # 프로덕션 DB 중복 체크
    existing = await find_duplicate(tech)
    if existing:
        await update_technician(existing, tech, force=True)
        return existing, "updated"

    # 새로 생성
    prod_properties = _build_properties(tech)
    create_kwargs = {
        "parent": {"database_id": settings.notion_database_id},
        "properties": prod_properties,
        "children": body_blocks if body_blocks else _markdown_to_blocks(_build_body_markdown(tech)),
    }
    if tech.cover_image_url:
        create_kwargs["cover"] = {"type": "external", "external": {"url": tech.cover_image_url}}

    page = await notion.pages.create(**create_kwargs)
    return page["id"], "created"
