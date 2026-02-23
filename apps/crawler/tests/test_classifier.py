"""classifier 모듈 단위 테스트 — 순수 로직만 검증."""

import pytest

from crawler.classifier import (
    _validate_result, _parse_json_response, _empty_result,
    format_phone, infer_region_from_address,
)


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

    def test_invalid_rank_defaults_to_empty(self):
        """유효하지 않은 rank는 빈 문자열로 정규화."""
        result = _validate_result({
            "name": "테스트",
            "trades": ["타일"],
            "rank": "사장",
        })
        assert result["rank"] == ""

    def test_empty_rank_preserved(self):
        """빈 문자열 rank가 유지된다."""
        result = _validate_result({
            "name": "테스트",
            "trades": ["타일"],
            "rank": "",
        })
        assert result["rank"] == ""

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

    def test_phone_formatted_with_hyphens(self):
        """phone은 하이픈 포함 형식으로 포매팅된다."""
        result = _validate_result({
            "name": "테스트",
            "trades": ["타일"],
            "phone": "010-1234-5678",
        })
        assert result["phone"] == "010-1234-5678"

    def test_phone_raw_digits_formatted(self):
        """숫자만 있는 phone도 하이픈 포매팅된다."""
        result = _validate_result({
            "name": "테스트",
            "trades": ["타일"],
            "phone": "01012345678",
        })
        assert result["phone"] == "010-1234-5678"


class TestFormatPhone:
    """format_phone 포매팅 로직."""

    def test_mobile_11_digits(self):
        assert format_phone("01012345678") == "010-1234-5678"

    def test_seoul_10_digits(self):
        assert format_phone("0212345678") == "02-1234-5678"

    def test_seoul_9_digits(self):
        assert format_phone("021234567") == "02-123-4567"

    def test_regional_11_digits(self):
        assert format_phone("05512345678") == "055-1234-5678"

    def test_regional_10_digits(self):
        assert format_phone("0311234567") == "031-123-4567"

    def test_empty_string(self):
        assert format_phone("") == ""

    def test_short_number(self):
        assert format_phone("1234") == "1234"

    def test_non_zero_start(self):
        assert format_phone("12345678") == "12345678"

    def test_internet_phone_050x(self):
        assert format_phone("050713404655") == "0507-1340-4655"

    def test_070_phone(self):
        assert format_phone("07012345678") == "070-1234-5678"


class TestInferRegionFromAddress:
    """infer_region_from_address 주소→지역 매핑."""

    def test_seoul(self):
        assert infer_region_from_address("서울특별시 서대문구 거북골로 84") == "서울"

    def test_gyeonggi(self):
        assert infer_region_from_address("경기도 수원시 팔달구") == "경기도"

    def test_gyeongnam(self):
        assert infer_region_from_address("경상남도 양산시 남부로 13") == "경상도"

    def test_busan(self):
        assert infer_region_from_address("부산광역시 부산진구 중앙대로") == "부산"

    def test_empty(self):
        assert infer_region_from_address("") == ""

    def test_no_match(self):
        assert infer_region_from_address("알수없는 주소") == ""


class TestEmptyResult:
    def test_has_is_professional(self):
        """빈 결과에 is_professional=True 포함."""
        result = _empty_result()
        assert result["is_professional"] is True

    def test_default_rank_empty(self):
        """빈 결과의 rank는 빈 문자열."""
        result = _empty_result()
        assert result["rank"] == ""


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
