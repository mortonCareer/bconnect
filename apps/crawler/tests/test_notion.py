"""notion 모듈 단위 테스트 — 순수 로직 함수만 검증."""

from crawler.models import Technician
from crawler.notion import _build_properties, _build_body_markdown, _markdown_to_blocks, _build_review_properties, _review_page_to_technician


def _make_tech(**kwargs) -> Technician:
    defaults = {"name": "테스트업체", "rank": "기공", "trades": ["타일"]}
    defaults.update(kwargs)
    return Technician(**defaults)


class TestBuildProperties:
    def test_required_fields(self):
        tech = _make_tech()
        props = _build_properties(tech)
        assert props["업체명"]["title"][0]["text"]["content"] == "테스트업체"
        assert props["구분"]["select"]["name"] == "기공"
        assert props["시공분야"]["multi_select"] == [{"name": "타일"}]

    def test_optional_phone(self):
        tech = _make_tech(phone="01012345678")
        props = _build_properties(tech)
        assert props["연락처"]["phone_number"] == "01012345678"

    def test_optional_email(self):
        tech = _make_tech(email="a@b.com")
        props = _build_properties(tech)
        assert props["이메일"]["email"] == "a@b.com"

    def test_empty_optional_excluded(self):
        tech = _make_tech()
        props = _build_properties(tech)
        assert "연락처" not in props
        assert "이메일" not in props
        assert "주소" not in props

    def test_detail_url(self):
        tech = _make_tech(detail_url="https://blog.naver.com/abc")
        props = _build_properties(tech)
        assert props["자세히보기"]["url"] == "https://blog.naver.com/abc"

    def test_multiple_trades(self):
        tech = _make_tech(trades=["타일", "줄눈", "방수"])
        props = _build_properties(tech)
        names = [s["name"] for s in props["시공분야"]["multi_select"]]
        assert names == ["타일", "줄눈", "방수"]

    def test_multiple_channels(self):
        tech = _make_tech(channels=["네이버블로그", "인스타그램"])
        props = _build_properties(tech)
        names = [c["name"] for c in props["채널"]["multi_select"]]
        assert names == ["네이버블로그", "인스타그램"]

    def test_synced_at_always_present(self):
        tech = _make_tech()
        props = _build_properties(tech)
        assert "최종 수집 일시" in props
        assert "start" in props["최종 수집 일시"]["date"]


class TestBuildBodyMarkdown:
    def test_headline_only(self):
        tech = _make_tech(headline="한줄소개 텍스트")
        md = _build_body_markdown(tech)
        assert md == "한줄소개 텍스트"

    def test_with_source_urls(self):
        tech = _make_tech(headline="소개", source_urls=["https://a.com", "https://b.com"])
        md = _build_body_markdown(tech)
        assert "소개" in md
        assert "출처: https://a.com, https://b.com" in md

    def test_empty(self):
        tech = _make_tech()
        md = _build_body_markdown(tech)
        assert md == ""


class TestMarkdownToBlocks:
    def test_paragraph(self):
        blocks = _markdown_to_blocks("안녕하세요")
        assert len(blocks) == 1
        assert blocks[0]["type"] == "paragraph"
        assert blocks[0]["paragraph"]["rich_text"][0]["text"]["content"] == "안녕하세요"

    def test_heading(self):
        blocks = _markdown_to_blocks("## 제목")
        assert blocks[0]["type"] == "heading_2"
        assert blocks[0]["heading_2"]["rich_text"][0]["text"]["content"] == "제목"

    def test_divider(self):
        blocks = _markdown_to_blocks("---")
        assert blocks[0]["type"] == "divider"

    def test_empty_lines_skipped(self):
        blocks = _markdown_to_blocks("첫째\n\n\n둘째")
        assert len(blocks) == 2

    def test_max_blocks_limit(self):
        md = "\n".join(f"line {i}" for i in range(200))
        blocks = _markdown_to_blocks(md, max_blocks=10)
        assert len(blocks) == 10

    def test_long_text_truncated(self):
        long_text = "가" * 3000
        blocks = _markdown_to_blocks(long_text)
        content = blocks[0]["paragraph"]["rich_text"][0]["text"]["content"]
        assert len(content) == 2000


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
        assert tech.rank == "기공"
        assert tech.trades == []
        assert tech.phone == ""
