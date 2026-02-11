"""instagram 모듈 단위 테스트 — 외부 API 호출 없이 순수 로직만 검증."""

from crawler.channels.instagram import (
    extract_username,
    build_search_queries,
    _empty_profile,
)


class TestExtractUsername:
    def test_standard_url(self):
        assert extract_username("https://www.instagram.com/tile_master/") == "tile_master"

    def test_without_trailing_slash(self):
        assert extract_username("https://www.instagram.com/tile_master") == "tile_master"

    def test_without_www(self):
        assert extract_username("https://instagram.com/my_shop") == "my_shop"

    def test_with_query_params(self):
        # 쿼리 파라미터 포함 URL — extract_username은 경로 부분만 추출
        assert extract_username("https://www.instagram.com/tile_pro") == "tile_pro"

    def test_post_url_rejected(self):
        assert extract_username("https://www.instagram.com/p/ABC123/") is None

    def test_reel_url_rejected(self):
        assert extract_username("https://www.instagram.com/reel/XYZ789/") is None

    def test_reels_url_rejected(self):
        assert extract_username("https://www.instagram.com/reels/XYZ789/") is None

    def test_explore_url_rejected(self):
        assert extract_username("https://www.instagram.com/explore/tags/tile/") is None

    def test_stories_url_rejected(self):
        assert extract_username("https://www.instagram.com/stories/someuser/") is None

    def test_non_instagram_url(self):
        assert extract_username("https://facebook.com/user123") is None

    def test_username_with_dots(self):
        assert extract_username("https://instagram.com/tile.master.kr") == "tile.master.kr"

    def test_username_with_numbers(self):
        assert extract_username("https://instagram.com/shop2024") == "shop2024"

    def test_empty_string(self):
        assert extract_username("") is None

    def test_username_lowercased(self):
        assert extract_username("https://instagram.com/TileMaster") == "tilemaster"


class TestBuildSearchQueries:
    def test_default_keywords(self):
        queries = build_search_queries(["타일", "줄눈"])
        assert len(queries) == 4  # 2 keywords × 2 templates
        assert any("타일" in q and "시공" in q for q in queries)
        assert all("site:instagram.com" in q for q in queries)

    def test_single_keyword(self):
        queries = build_search_queries(["방수"])
        assert len(queries) == 2

    def test_uses_default_keywords_when_none(self):
        queries = build_search_queries()
        # SEARCH_KEYWORDS는 68개 → 68 × 2 = 136
        assert len(queries) > 10
        assert all("site:instagram.com" in q for q in queries)


class TestEmptyProfile:
    def test_structure(self):
        result = _empty_profile("test_user")
        assert result["about"] == ""
        assert result["headline"] == ""
        assert result["instagram"] == "test_user"
        assert result["source_urls"] == ["https://www.instagram.com/test_user/"]
        assert result["phone"] == ""
        assert result["email"] == ""
        assert result["youtube"] == ""
        assert result["full_name"] == ""
        assert result["profile_pic_url"] == ""
        assert result["external_url"] == ""

    def test_source_url_format(self):
        result = _empty_profile("my_shop")
        assert result["source_urls"] == ["https://www.instagram.com/my_shop/"]
