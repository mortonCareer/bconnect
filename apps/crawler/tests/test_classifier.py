"""classifier 모듈 단위 테스트 — 순수 로직만 검증."""

import pytest

from crawler.classifier import _validate_result, _parse_json_response, _empty_result


class TestValidateResult:
    """_validate_result 정규화 로직."""

    def test_no_auto_upgrade_rank_with_business_number(self):
        """사업자등록번호가 있어도 rank를 자동 승격하지 않는다."""
        result = _validate_result({
            "name": "테스트타일",
            "trades": ["타일"],
            "rank": "기공",
            "business_number": "123-45-67890",
        })
        assert result["rank"] == "기공"

    def test_no_auto_upgrade_rank_with_business_name(self):
        """업체명에 건설 키워드가 있어도 rank를 자동 승격하지 않는다."""
        result = _validate_result({
            "name": "케이종합건설",
            "trades": ["타일"],
            "rank": "기공",
        })
        assert result["rank"] == "기공"

    def test_preserves_explicit_rank(self):
        """LLM이 반장으로 분류하면 유지된다."""
        result = _validate_result({
            "name": "테스트업체",
            "trades": ["타일"],
            "rank": "반장",
        })
        assert result["rank"] == "반장"

    def test_invalid_rank_defaults_to_gigong(self):
        """유효하지 않은 rank는 기공으로 정규화."""
        result = _validate_result({
            "name": "테스트",
            "trades": ["타일"],
            "rank": "사장",
        })
        assert result["rank"] == "기공"

    def test_defaults_is_professional_true(self):
        """is_professional 기본값은 True."""
        result = _validate_result({"name": "테스트", "trades": ["타일"]})
        assert result["is_professional"] is True

    def test_normalizes_is_professional_to_bool(self):
        """is_professional을 bool로 정규화한다."""
        result = _validate_result({
            "name": "테스트",
            "trades": ["타일"],
            "is_professional": 0,
        })
        assert result["is_professional"] is False

    def test_is_professional_false_preserved(self):
        """is_professional=False가 유지된다."""
        result = _validate_result({
            "name": "DIY블로거",
            "trades": ["기타"],
            "is_professional": False,
        })
        assert result["is_professional"] is False

    def test_trades_normalized(self):
        """유효하지 않은 trades는 필터링, 빈 경우 기타."""
        result = _validate_result({"name": "테스트", "trades": ["없는분야"]})
        assert result["trades"] == ["기타"]

    def test_trades_max_three(self):
        """trades는 최대 3개."""
        result = _validate_result({
            "name": "테스트",
            "trades": ["타일", "도장", "방수", "미장"],
        })
        assert len(result["trades"]) == 3

    def test_phone_normalized(self):
        """phone에서 하이픈·점·공백 제거."""
        result = _validate_result({
            "name": "테스트",
            "trades": ["타일"],
            "phone": "010-1234-5678",
        })
        assert result["phone"] == "01012345678"


class TestEmptyResult:
    def test_has_is_professional(self):
        """빈 결과에 is_professional=True 포함."""
        result = _empty_result()
        assert result["is_professional"] is True

    def test_default_rank(self):
        result = _empty_result()
        assert result["rank"] == "기공"


class TestParseJsonResponse:
    def test_plain_json(self):
        result = _parse_json_response('{"phone": "01012345678"}')
        assert result == {"phone": "01012345678"}

    def test_json_code_block(self):
        result = _parse_json_response('```json\n{"phone": "01012345678"}\n```')
        assert result == {"phone": "01012345678"}

    def test_invalid_json(self):
        result = _parse_json_response("not json at all")
        assert result is None

    def test_empty_string(self):
        result = _parse_json_response("")
        assert result is None


class TestExtractTextFromImage:
    @pytest.mark.asyncio
    async def test_returns_empty_on_no_url(self):
        """image_url이 비어있으면 빈 dict 반환."""
        from crawler.classifier import extract_text_from_image
        result, usage = await extract_text_from_image("")
        assert result == {}
        assert usage == {"input_tokens": 0, "output_tokens": 0}
