"""naver_blog 모듈 단위 테스트 — 외부 API 호출 없이 순수 로직만 검증."""

from crawler.channels.naver_blog import (
    extract_blog_id,
    extract_contact_info,
    _extract_post_content_url,
    build_search_queries,
)


class TestExtractBlogId:
    def test_standard_url(self):
        assert extract_blog_id("https://blog.naver.com/eoem620/223982358289") == "eoem620"

    def test_mobile_url(self):
        assert extract_blog_id("https://m.blog.naver.com/abc123/12345") == "abc123"

    def test_blog_home(self):
        assert extract_blog_id("https://blog.naver.com/myid") == "myid"

    def test_non_naver_url(self):
        assert extract_blog_id("https://tistory.com/abc/123") is None

    def test_empty_path(self):
        assert not extract_blog_id("https://blog.naver.com/")


class TestExtractPostContentUrl:
    def test_standard(self):
        url = _extract_post_content_url("https://blog.naver.com/abc/12345")
        assert url == "https://blog.naver.com/PostView.naver?blogId=abc&logNo=12345&noTrackingCode=true"

    def test_mobile(self):
        url = _extract_post_content_url("https://m.blog.naver.com/abc/12345")
        assert url == "https://blog.naver.com/PostView.naver?blogId=abc&logNo=12345&noTrackingCode=true"

    def test_non_naver(self):
        assert _extract_post_content_url("https://example.com/abc/123") is None

    def test_no_log_no(self):
        assert _extract_post_content_url("https://blog.naver.com/abc") is None


class TestExtractContactInfo:
    def test_phone_with_dashes(self):
        result = extract_contact_info("연락처: 010-1234-5678 입니다")
        assert result["phone"] == "01012345678"

    def test_phone_no_dashes(self):
        result = extract_contact_info("전화 01098765432 문의")
        assert result["phone"] == "01098765432"

    def test_email(self):
        result = extract_contact_info("이메일: test@example.com")
        assert result["email"] == "test@example.com"

    def test_instagram_url(self):
        result = extract_contact_info("instagram.com/my_shop")
        assert result["instagram"] == "my_shop"

    def test_instagram_korean(self):
        result = extract_contact_info("인스타 : my_shop")
        assert result["instagram"] == "my_shop"

    def test_youtube_url(self):
        result = extract_contact_info("youtube.com/@mychannel")
        assert result["youtube"] == "mychannel"

    def test_youtube_korean(self):
        result = extract_contact_info("유튜브 : 시공채널")
        assert result["youtube"] == "시공채널"

    def test_no_contact(self):
        result = extract_contact_info("아무 연락처도 없는 텍스트")
        assert result == {"phone": "", "email": "", "instagram": "", "youtube": ""}

    def test_multiple_phones_returns_first(self):
        result = extract_contact_info("010-1111-2222 또는 010-3333-4444")
        assert result["phone"] == "01011112222"


class TestBuildSearchQueries:
    def test_default_keywords(self):
        queries = build_search_queries(["타일", "줄눈"])
        assert len(queries) == 4  # 2 keywords × 2 templates
        assert "타일 시공업체 수도권" in queries
        assert "줄눈 시공 전문 서울 경기" in queries

    def test_single_keyword(self):
        queries = build_search_queries(["방수"])
        assert len(queries) == 2
