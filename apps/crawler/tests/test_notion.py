"""notion 모듈 단위 테스트 — 순수 로직 함수만 검증."""

from crawler.models import Technician
from crawler.notion import _build_properties, _build_body_markdown, _markdown_to_blocks


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
