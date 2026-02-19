# 검수 파이프라인 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 크롤러가 프로덕션 DB 대신 검수 DB에 저장하고, 인간 검수 후 승인 건만 프로덕션으로 이동하는 파이프라인을 추가한다.

**Architecture:** 별도 Notion 검수 DB (프로덕션 스키마 미러 + 검수상태/거절사유 컬럼). 크롤러 기본 저장 대상을 검수 DB로 변경하고, `--approve` 명령으로 승인 건을 프로덕션으로 복사. `--direct` 플래그로 기존 프로덕션 직접 저장도 유지.

**Tech Stack:** Python 3.12, notion-client (async), pydantic-settings, pytest

**Working directory:** `/home/json/morton-worktrees/feat-review-pipeline/apps/crawler/`

---

### Task 1: config.py — 검수 DB ID 설정 추가

**Files:**
- Modify: `src/crawler/config.py:20-22`

**Step 1: 환경변수 추가**

`config.py`의 `Settings` 클래스에 `notion_review_database_id` 필드를 추가한다.

```python
# Notion
notion_token: str
notion_database_id: str = "bc8b0266918d4d91b8171ba5203d0bdf"
notion_review_database_id: str = ""  # 검수 DB (비어있으면 검수 기능 비활성)
```

검수 DB ID가 비어있으면 검수 파이프라인을 사용할 수 없도록 한다 (기존 동작 유지).

**Step 2: .env.example 업데이트**

`.env.example`에 새 변수 추가:

```
NOTION_REVIEW_DATABASE_ID=  # 검수 DB ID (선택)
```

**Step 3: 실제 .env에 검수 DB ID 설정**

`.env` 파일에 실제 검수 DB ID를 추가한다:

```
NOTION_REVIEW_DATABASE_ID=306965d2888b80cd8447e5a21da9efbd
```

**Step 4: 커밋**

```bash
git add src/crawler/config.py .env.example
git commit -m "feat(crawler): add NOTION_REVIEW_DATABASE_ID config"
```

---

### Task 2: notion.py — 검수 DB 헬퍼 함수들 (TDD)

**Files:**
- Modify: `src/crawler/notion.py`
- Modify: `tests/test_notion.py`

이 태스크에서는 3개의 새 함수를 추가한다:
1. `_build_review_properties()` — 검수 DB용 속성 dict 생성 (기존 + 검수상태)
2. `REVIEW_REQUIRED_PROPERTIES` — 검수 DB 스키마 정의
3. `validate_review_schema()` — 검수 DB 스키마 검증

#### Step 1: 테스트 작성 — `_build_review_properties()`

`tests/test_notion.py`에 추가:

```python
from crawler.notion import _build_review_properties

class TestBuildReviewProperties:
    def test_includes_review_status(self):
        tech = _make_tech()
        props = _build_review_properties(tech)
        assert props["검수상태"]["select"]["name"] == "대기중"

    def test_includes_all_production_fields(self):
        tech = _make_tech(phone="01012345678", email="a@b.com")
        props = _build_review_properties(tech)
        assert "업체명" in props
        assert "연락처" in props
        assert "이메일" in props
        assert "검수상태" in props

    def test_custom_review_status(self):
        tech = _make_tech()
        props = _build_review_properties(tech, review_status="승인")
        assert props["검수상태"]["select"]["name"] == "승인"
```

**Step 2: 테스트 실행 → 실패 확인**

```bash
uv run python -m pytest tests/test_notion.py::TestBuildReviewProperties -v
```

Expected: `ImportError: cannot import name '_build_review_properties'`

#### Step 3: 구현 — `_build_review_properties()`

`src/crawler/notion.py`에 추가 (기존 `_build_properties` 아래):

```python
REVIEW_REQUIRED_PROPERTIES: dict[str, str] = {
    **REQUIRED_PROPERTIES,
    "검수상태": "select",
    "거절사유": "rich_text",
}


def _build_review_properties(tech: Technician, review_status: str = "대기중") -> dict:
    """Technician → 검수 DB 속성 dict 변환. 프로덕션 속성 + 검수상태."""
    properties = _build_properties(tech)
    properties["검수상태"] = {"select": {"name": review_status}}
    return properties
```

**Step 4: 테스트 실행 → 성공 확인**

```bash
uv run python -m pytest tests/test_notion.py::TestBuildReviewProperties -v
```

Expected: 3 passed

**Step 5: 커밋**

```bash
git add src/crawler/notion.py tests/test_notion.py
git commit -m "feat(crawler): add _build_review_properties for review DB"
```

---

### Task 3: notion.py — save_to_review() & find_review_duplicate()

**Files:**
- Modify: `src/crawler/notion.py`

이 함수들은 Notion API를 호출하므로 단위 테스트 없이 구현한다 (기존 `save_technician`/`find_duplicate` 패턴과 동일).

#### Step 1: `find_review_duplicate()` 구현

기존 `find_duplicate_by_url()`과 동일하되 검수 DB를 대상으로 한다.

```python
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
```

#### Step 2: `save_to_review()` 구현

기존 `save_technician()`과 구조 동일, 검수 DB에 저장 + 검수상태=대기중 설정.

```python
async def save_to_review(tech: Technician) -> str:
    """기술자 레코드를 검수 DB에 저장하고 page_id를 반환한다.

    중복이 있으면 업데이트하고 기존 page_id를 반환한다.
    새 레코드는 검수상태=대기중으로 생성된다.
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
```

#### Step 3: `validate_review_schema()` 구현

```python
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
```

#### Step 4: 커밋

```bash
git add src/crawler/notion.py
git commit -m "feat(crawler): add save_to_review and find_review_duplicate"
```

---

### Task 4: notion.py — find_approved() & move_to_production()

**Files:**
- Modify: `src/crawler/notion.py`

#### Step 1: `find_approved()` 구현

검수 DB에서 검수상태=승인인 페이지를 모두 조회한다.

```python
async def find_approved() -> list[dict]:
    """검수 DB에서 검수상태=승인인 레코드를 모두 가져온다.

    반환값: [{page_id, properties(raw), cover, blocks}]
    """
    review_db_id = settings.notion_review_database_id
    pages: list[dict] = []
    start_cursor = None

    while True:
        body: dict = {
            "filter": {"property": "검수상태", "select": {"equals": "승인"}},
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
```

#### Step 2: `_review_page_to_technician()` 헬퍼 구현

검수 DB 페이지의 속성을 Technician 모델로 변환한다. `_read_prop()`을 재활용.

```python
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
        rank=_read_prop(props, "구분") or "기공",
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
```

#### Step 3: `move_to_production()` 구현

```python
async def move_to_production(review_page: dict) -> tuple[str, str]:
    """검수 DB 승인 건을 프로덕션 DB로 복사한다.

    Args:
        review_page: find_approved()가 반환한 페이지 dict

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
```

#### Step 4: 커밋

```bash
git add src/crawler/notion.py
git commit -m "feat(crawler): add find_approved and move_to_production"
```

---

### Task 5: notion.py — _review_page_to_technician 테스트 (TDD)

**Files:**
- Modify: `tests/test_notion.py`

#### Step 1: 테스트 작성

```python
from crawler.notion import _review_page_to_technician

class TestReviewPageToTechnician:
    def test_basic_conversion(self):
        props = {
            "업체명": {"type": "title", "title": [{"plain_text": "테스트업체"}]},
            "구분": {"type": "select", "select": {"name": "반장"}},
            "시공분야": {"type": "multi_select", "multi_select": [{"name": "타일"}, {"name": "줄눈"}]},
            "채널": {"type": "multi_select", "multi_select": [{"name": "네이버블로그"}]},
            "대표자": {"type": "rich_text", "rich_text": [{"plain_text": "홍길동"}]},
            "지역": {"type": "select", "select": {"name": "서울"}},
            "주소": {"type": "rich_text", "rich_text": [{"plain_text": "서울시 강남구"}]},
            "연락처": {"type": "phone_number", "phone_number": "01012345678"},
            "이메일": {"type": "email", "email": "test@test.com"},
            "사업자등록번호": {"type": "rich_text", "rich_text": [{"plain_text": "123-45-67890"}]},
            "경력": {"type": "number", "number": 5},
            "인증": {"type": "multi_select", "multi_select": []},
            "자세히보기": {"type": "url", "url": "https://blog.naver.com/test"},
            "최종 수집 일시": {"type": "date", "date": {"start": "2026-01-01"}},
        }
        tech = _review_page_to_technician(props)
        assert tech.name == "테스트업체"
        assert tech.rank == "반장"
        assert tech.trades == ["타일", "줄눈"]
        assert tech.phone == "01012345678"
        assert tech.email == "test@test.com"
        assert tech.representative == "홍길동"
        assert tech.detail_url == "https://blog.naver.com/test"

    def test_empty_optional_fields(self):
        props = {
            "업체명": {"type": "title", "title": [{"plain_text": "최소업체"}]},
            "구분": {"type": "select", "select": None},
            "시공분야": {"type": "multi_select", "multi_select": []},
            "채널": {"type": "multi_select", "multi_select": []},
            "대표자": {"type": "rich_text", "rich_text": []},
            "지역": {"type": "select", "select": None},
            "주소": {"type": "rich_text", "rich_text": []},
            "연락처": {"type": "phone_number", "phone_number": None},
            "이메일": {"type": "email", "email": None},
            "사업자등록번호": {"type": "rich_text", "rich_text": []},
            "경력": {"type": "number", "number": None},
            "인증": {"type": "multi_select", "multi_select": []},
            "자세히보기": {"type": "url", "url": None},
            "최종 수집 일시": {"type": "date", "date": None},
        }
        tech = _review_page_to_technician(props)
        assert tech.name == "최소업체"
        assert tech.rank == "기공"  # default
        assert tech.trades == []
        assert tech.phone == ""
```

#### Step 2: 테스트 실행 → 성공 확인

```bash
uv run python -m pytest tests/test_notion.py::TestReviewPageToTechnician -v
```

Expected: 2 passed

#### Step 3: 커밋

```bash
git add tests/test_notion.py
git commit -m "test(crawler): add _review_page_to_technician tests"
```

---

### Task 6: main.py — run_approve() 함수

**Files:**
- Modify: `src/crawler/main.py`

#### Step 1: import 추가

`main.py` 상단의 notion import에 새 함수들을 추가:

```python
from crawler.notion import (
    save_technician, save_to_review, update_technician,
    find_duplicate_by_url, touch_synced_at,
    find_pages_needing_enrichment, find_approved, move_to_production,
    validate_schema, validate_review_schema,
)
```

#### Step 2: `run_approve()` 함수 구현

`run_enrich()` 아래에 추가:

```python
async def run_approve() -> PipelineReport:
    """검수 DB에서 승인된 레코드를 프로덕션 DB로 이동한다."""
    pages = await find_approved()
    log.info("승인 건: %d건", len(pages))

    report = PipelineReport()
    report.mode = "검수 승인"
    report.total_searched = len(pages)

    if not pages:
        log.info("승인된 레코드가 없습니다")
        return report

    sem = asyncio.Semaphore(CONCURRENCY)
    moved = 0

    progress = create_progress()
    with progress:
        task = progress.add_task(f"프로덕션 이동 ({len(pages)}건)", total=len(pages))

        async def _handle(page: dict) -> None:
            nonlocal moved
            props = page["properties"]
            name = props.get("업체명", {}).get("title", [{}])
            name = name[0]["plain_text"] if name and name[0].get("plain_text") else "이름없음"

            async with sem:
                try:
                    page_id, status = await move_to_production(page)
                except Exception as exc:
                    log.warning("이동 실패: %s", name, exc_info=True)
                    report.add_failed("", name, "이동", str(exc))
                    progress.console.print(f"  [red]x {name} — 이동 실패[/red]")
                    progress.advance(task)
                    return

            moved += 1
            action = "업데이트" if status == "updated" else "신규생성"
            log.info("이동 완료: %s → %s (%s)", name, page_id, action)
            report.add_saved(
                blog_url="", blogger_name=name,
                tech_name=name, rank="", trades=[],
                phone="", page_id=page_id,
            )
            progress.console.print(f"  [green]v[/green] {name} → {action}")
            progress.advance(task)

        await asyncio.gather(*[_handle(p) for p in pages])

    log.info("승인 이동 완료: %d/%d건", moved, len(pages))
    return report
```

#### Step 3: 커밋

```bash
git add src/crawler/main.py
git commit -m "feat(crawler): add run_approve for review-to-production migration"
```

---

### Task 7: main.py — 파이프라인 저장 대상 변경 + CLI 인자

**Files:**
- Modify: `src/crawler/main.py`

#### Step 1: `run_pipeline()` 내 `save_technician` → 분기 처리

`run_pipeline()`과 `run_instagram_pipeline()`에 `direct` 파라미터를 추가한다.

`run_pipeline()` 시그니처 변경:

```python
async def run_pipeline(
    query: str, count: int = 10, seen_blog_ids: set[str] | None = None,
    report: PipelineReport | None = None, dry_run: bool = False,
    force: bool = False, direct: bool = False,
) -> list[str]:
```

`_handle()` 내부의 저장 로직 (약 line 403-411):

```python
        try:
            if direct:
                page_id = await save_technician(tech, force=force)
            else:
                page_id = await save_to_review(tech)
        except Exception as exc:
```

같은 패턴으로 `run_instagram_pipeline()`의 `_handle()` 내 저장 로직도 변경.

`run_full()` → `run_pipeline()` 호출에 `direct` 전달:

```python
await run_pipeline(
    q, count=per_query, seen_blog_ids=seen_blog_ids,
    report=report, dry_run=dry_run, force=force, direct=direct,
)
```

`run_full()`과 `run_instagram_full()` 시그니처에도 `direct: bool = False` 추가.

#### Step 2: CLI 인자 추가

`main()` 함수의 argparse 섹션에 추가:

```python
parser.add_argument("--approve", action="store_true", help="검수 DB 승인 건을 프로덕션 DB로 이동")
parser.add_argument("--direct", action="store_true", help="검수 DB 거치지 않고 프로덕션 DB 직접 저장")
```

#### Step 3: main() 분기 로직 추가

`main()` 함수의 실행 분기 (try 블록 내)에 `--approve` 처리 추가:

```python
    try:
        if args.approve:
            report = asyncio.run(run_approve())
        elif args.enrich:
            report = asyncio.run(run_enrich())
        elif args.from_file:
            report = asyncio.run(run_from_file(args.from_file, force=args.force))
        elif args.instagram and args.full:
            report = asyncio.run(run_instagram_full(per_query=args.per_query, dry_run=args.dry_run, force=args.force))
        elif args.instagram:
            # ... (기존 코드)
        elif args.full:
            report = asyncio.run(run_full(per_query=args.per_query, dry_run=args.dry_run, force=args.force, direct=args.direct))
        else:
            # ... (기존 코드)
            asyncio.run(run_pipeline(query, count=count, report=report, dry_run=args.dry_run, force=args.force, direct=args.direct))
```

스키마 검증 분기도 수정:

```python
    if not args.dry_run:
        if args.approve or not args.direct:
            # 검수 DB 스키마 검증
            review_errors = asyncio.run(validate_review_schema())
            if review_errors:
                console.print("[red]검수 DB 스키마 불일치:[/red]")
                for err in review_errors:
                    console.print(f"  [red]• {err}[/red]")
                raise SystemExit(1)

        if args.approve or args.direct or args.enrich:
            # 프로덕션 DB 스키마 검증
            schema_errors = asyncio.run(validate_schema())
            if schema_errors:
                console.print("[red]노션 DB 스키마 불일치:[/red]")
                for err in schema_errors:
                    console.print(f"  [red]• {err}[/red]")
                raise SystemExit(1)
```

콘솔 모드 표시 추가:

```python
    if args.approve:
        console.print("[cyan]검수 승인 모드: 승인 건 → 프로덕션 DB 이동[/cyan]")
    if args.direct:
        console.print("[yellow]direct 모드: 프로덕션 DB 직접 저장[/yellow]")
```

`suppress_console` 조건도 업데이트:

```python
    suppress_console = args.full or args.enrich or args.approve
```

#### Step 4: 커밋

```bash
git add src/crawler/main.py
git commit -m "feat(crawler): route saves to review DB by default, add --approve and --direct flags"
```

---

### Task 8: Notion 검수 DB 스키마 세팅

**Files:** 없음 (Notion UI 또는 API 작업)

#### Step 1: 검수 DB 스키마 확인

현재 검수 DB(`306965d2888b80cd8447e5a21da9efbd`)에는 `이름` 컬럼만 있으므로
프로덕션 DB와 동일한 스키마를 설정해야 한다.

Notion MCP 도구로 DB 속성 추가가 가능한지 확인한다.
불가능하면 사용자에게 Notion UI에서 수동 설정을 안내한다.

필요한 속성:
- 이름 → 업체명으로 rename (title)
- 검수상태 (select): 대기중, 승인, 거절
- 거절사유 (rich_text)
- 구분 (select): 반장, 기공, 준기공, 조공
- 시공분야 (multi_select)
- 채널 (multi_select)
- 대표자 (rich_text)
- 지역 (select)
- 주소 (rich_text)
- 연락처 (phone_number)
- 이메일 (email)
- 사업자등록번호 (rich_text)
- 경력 (number)
- 인증 (multi_select)
- 자세히보기 (url)
- 최종 수집 일시 (date)

#### Step 2: 스키마 검증 실행

```bash
uv run python -c "
import asyncio
from crawler.notion import validate_review_schema
errors = asyncio.run(validate_review_schema())
if errors:
    for e in errors: print(f'  ❌ {e}')
else:
    print('  ✅ 검수 DB 스키마 OK')
"
```

스키마 에러가 있으면 사용자에게 Notion UI에서 수정 안내.

---

### Task 9: 전체 테스트 실행 + 통합 확인

**Files:** 없음

#### Step 1: 전체 테스트 실행

```bash
uv run python -m pytest tests/ -v
```

Expected: 모든 테스트 통과 (기존 56 + 신규 5 = 61개)

#### Step 2: dry-run 테스트 (실제 API 호출 없이)

```bash
uv run crawler --dry-run "타일 시공업체"
```

Expected: 기존처럼 dry-run 동작 (검수 DB 스키마 검증 스킵)

#### Step 3: --approve 도움말 확인

```bash
uv run crawler --help
```

Expected: `--approve`, `--direct` 옵션이 보임

#### Step 4: 최종 커밋

```bash
git add -A
git commit -m "test(crawler): verify review pipeline integration"
```

---

### Task 10: PR 생성

#### Step 1: 변경 사항 확인

```bash
git log --oneline main..feat/review-pipeline
```

#### Step 2: PR 생성

```bash
gh pr create --title "feat(crawler): add human review pipeline" --body "$(cat <<'EOF'
## Summary
- 크롤러 기본 저장 대상을 프로덕션 DB → 검수 DB로 변경
- 인간이 Notion에서 검수(승인/거절) 후 `--approve`로 프로덕션 이동
- `--direct` 플래그로 기존 프로덕션 직접 저장 유지

## Changes
- `config.py`: `NOTION_REVIEW_DATABASE_ID` 환경변수 추가
- `notion.py`: `save_to_review()`, `find_approved()`, `move_to_production()` 등 검수 DB 함수 추가
- `main.py`: 저장 대상 검수 DB로 변경, `--approve`/`--direct` CLI 인자 추가
- `tests/`: 검수 DB 관련 테스트 추가

## Test plan
- [ ] `uv run pytest tests/ -v` — 전체 테스트 통과
- [ ] `uv run crawler --dry-run "타일"` — dry-run 기존 동작 유지
- [ ] `uv run crawler "타일 시공업체"` — 검수 DB에 저장 확인
- [ ] Notion에서 검수상태 "승인"으로 변경
- [ ] `uv run crawler --approve` — 프로덕션 DB로 이동 확인
- [ ] `uv run crawler --direct "타일"` — 프로덕션 직접 저장 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
