"""notion 모듈 단위 테스트 — 순수 로직 함수만 검증."""

from crawler.models import CrawledMember, CrawledPost, CrawledProfile
from crawler.notion import (
    _build_properties, _build_body_markdown, _markdown_to_blocks,
    _build_review_properties, _posts_to_blocks, _review_page_to_member,
)


def _make_member(**kwargs) -> CrawledMember:
    profile_kwargs = kwargs.pop("profile_kwargs", {})
    profile_defaults = {"trades": ["타일"], "primary_trade": "타일"}
    profile_defaults.update(profile_kwargs)
    defaults = {"company": "테스트업체", "role": "기공", "profile": CrawledProfile(**profile_defaults)}
    defaults.update(kwargs)
    return CrawledMember(**defaults)


class TestBuildProperties:
    def test_required_fields(self):
        member = _make_member()
        props = _build_properties(member)
        assert props["업체명"]["title"][0]["text"]["content"] == "테스트업체"
        assert props["구분"]["select"]["name"] == "기공"
        assert props["시공분야"]["multi_select"] == [{"name": "타일"}]

    def test_optional_phone_formatted_for_notion(self):
        # 모델은 BE 포맷(숫자만), 노션 표시는 하이픈 포맷
        member = _make_member(phone="01012345678")
        props = _build_properties(member)
        assert props["연락처"]["phone_number"] == "010-1234-5678"

    def test_optional_email(self):
        member = _make_member(email="a@b.com")
        props = _build_properties(member)
        assert props["이메일"]["email"] == "a@b.com"

    def test_empty_optional_excluded(self):
        member = _make_member()
        props = _build_properties(member)
        assert "연락처" not in props
        assert "이메일" not in props
        assert "주소" not in props

    def test_profile_url(self):
        member = _make_member(profile_kwargs={"url": "https://blog.naver.com/abc"})
        props = _build_properties(member)
        assert props["자세히보기"]["url"] == "https://blog.naver.com/abc"

    def test_multiple_trades(self):
        member = _make_member(profile_kwargs={"trades": ["타일", "줄눈", "방수"]})
        props = _build_properties(member)
        names = [s["name"] for s in props["시공분야"]["multi_select"]]
        assert names == ["타일", "줄눈", "방수"]

    def test_channel_from_platform(self):
        member = _make_member()
        props = _build_properties(member)
        names = [c["name"] for c in props["채널"]["multi_select"]]
        assert names == ["네이버블로그"]

    def test_channel_override_merged(self):
        member = _make_member()
        props = _build_properties(member, channels=["네이버블로그", "인스타그램"])
        names = [c["name"] for c in props["채널"]["multi_select"]]
        assert names == ["네이버블로그", "인스타그램"]

    def test_region_kr_from_state_enum(self):
        member = _make_member(profile_kwargs={"state": "GYEONGGI"})
        props = _build_properties(member)
        assert props["지역"]["select"]["name"] == "경기"

    def test_experience(self):
        member = _make_member(profile_kwargs={"experience": 10})
        props = _build_properties(member)
        assert props["경력"]["number"] == 10

    def test_synced_at_always_present(self):
        member = _make_member()
        props = _build_properties(member)
        assert "최종 수집 일시" in props
        assert "start" in props["최종 수집 일시"]["date"]


class TestBuildBodyMarkdown:
    def test_headline_only(self):
        member = _make_member(profile_kwargs={"headline": "한줄소개 텍스트"})
        md = _build_body_markdown(member)
        assert md == "한줄소개 텍스트"

    def test_with_source_urls(self):
        member = _make_member(
            profile_kwargs={"headline": "소개"},
            source_urls=["https://a.com", "https://b.com"],
        )
        md = _build_body_markdown(member)
        assert "소개" in md
        assert "출처: https://a.com, https://b.com" in md

    def test_empty(self):
        member = _make_member()
        md = _build_body_markdown(member)
        assert md == ""


class TestPostsToBlocks:
    def test_post_with_images(self):
        member = _make_member(posts=[CrawledPost(
            title="타일 시공 사례",
            content="본문",
            images=["https://postfiles.pstatic.net/a.jpg?type=w966"],
            source_url="https://blog.naver.com/abc/1",
        )])
        blocks = _posts_to_blocks(member)
        types = [b["type"] for b in blocks]
        assert types == ["heading_2", "paragraph", "image"]
        assert blocks[0]["heading_2"]["rich_text"][0]["text"]["content"] == "타일 시공 사례"
        assert blocks[2]["image"]["external"]["url"] == "https://postfiles.pstatic.net/a.jpg?type=w966"

    def test_post_without_images_skipped(self):
        member = _make_member(posts=[CrawledPost(title="글", content="본문만")])
        assert _posts_to_blocks(member) == []

    def test_images_per_post_cap(self):
        member = _make_member(posts=[CrawledPost(
            title="사례",
            images=[f"https://postfiles.pstatic.net/{i}.jpg" for i in range(10)],
        )])
        blocks = _posts_to_blocks(member, images_per_post=3)
        assert sum(1 for b in blocks if b["type"] == "image") == 3


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
        member = _make_member()
        props = _build_review_properties(member)
        assert props["상태"]["status"]["name"] == "시작 전"

    def test_includes_all_production_fields(self):
        member = _make_member(phone="01012345678", email="a@b.com")
        props = _build_review_properties(member)
        assert "업체명" in props
        assert "연락처" in props
        assert "이메일" in props
        assert "상태" in props

    def test_custom_review_status(self):
        member = _make_member()
        props = _build_review_properties(member, review_status="승인")
        assert props["상태"]["status"]["name"] == "승인"


class TestReviewPageToMember:
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
        member = _review_page_to_member(props)
        assert member.company == "테스트업체"
        assert member.role == "반장"
        assert member.profile.trades == ["타일", "줄눈"]
        assert member.profile.state == "SEOUL"
        assert member.profile.experience == 5
        assert member.phone == "01012345678"
        assert member.email == "test@test.com"
        assert member.name == "홍길동"
        assert member.profile.url == "https://blog.naver.com/test"
        assert member.profile.platform == "NAVER"

    def test_legacy_broad_region_unmapped(self):
        props = {
            "업체명": {"type": "title", "title": [{"plain_text": "업체"}]},
            "지역": {"type": "select", "select": {"name": "충청도"}},
            "채널": {"type": "multi_select", "multi_select": []},
            "시공분야": {"type": "multi_select", "multi_select": []},
            "인증": {"type": "multi_select", "multi_select": []},
        }
        member = _review_page_to_member(props)
        assert member.profile.state == ""

    def test_legacy_gyeonggido_mapped(self):
        props = {
            "업체명": {"type": "title", "title": [{"plain_text": "업체"}]},
            "지역": {"type": "select", "select": {"name": "경기도"}},
            "채널": {"type": "multi_select", "multi_select": []},
            "시공분야": {"type": "multi_select", "multi_select": []},
            "인증": {"type": "multi_select", "multi_select": []},
        }
        member = _review_page_to_member(props)
        assert member.profile.state == "GYEONGGI"

    def test_instagram_platform_from_url(self):
        props = {
            "업체명": {"type": "title", "title": [{"plain_text": "업체"}]},
            "채널": {"type": "multi_select", "multi_select": []},
            "시공분야": {"type": "multi_select", "multi_select": []},
            "인증": {"type": "multi_select", "multi_select": []},
            "자세히보기": {"type": "url", "url": "https://www.instagram.com/abc/"},
        }
        member = _review_page_to_member(props)
        assert member.profile.platform == "INSTAGRAM"

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
        member = _review_page_to_member(props)
        assert member.company == "최소업체"
        assert member.role == ""
        assert member.profile.trades == []
        assert member.phone == ""
