"""기술자 분류 — LLM(Anthropic/OpenAI) 또는 수동 JSON 모드."""

import asyncio
import json
import logging
import re
from pathlib import Path

from crawler.config import settings
from crawler.models import TRADES, RANKS

log = logging.getLogger(__name__)

# LLM API 호출 제한 (TPM 200K 초과 방지)
# - 동시 1개 (세마포어)
# - 텍스트 호출 간 3초, Vision 호출 간 8초 (이미지 토큰이 ~10K로 커서)
# - 429 시 exponential backoff 재시도 (최대 3회)
_llm_semaphore = asyncio.Semaphore(1)
_llm_last_call: float = 0.0  # monotonic timestamp
_LLM_INTERVAL = 3.0  # 텍스트 호출 간 최소 간격 (초)
_LLM_VISION_INTERVAL = 8.0  # Vision 호출 간 최소 간격 (초)
_LLM_MAX_RETRIES = 3


async def _llm_throttle(vision: bool = False):
    """LLM 호출 전 rate limit 대기."""
    global _llm_last_call
    import time
    interval = _LLM_VISION_INTERVAL if vision else _LLM_INTERVAL
    now = time.monotonic()
    wait = interval - (now - _llm_last_call)
    if wait > 0:
        await asyncio.sleep(wait)
    _llm_last_call = time.monotonic()


def _is_rate_limit_error(exc: Exception) -> bool:
    """OpenAI/Anthropic 429 에러인지 판별."""
    # openai.RateLimitError
    err_type = type(exc).__name__
    if err_type == "RateLimitError":
        return True
    # status_code 속성 확인
    if hasattr(exc, "status_code") and exc.status_code == 429:
        return True
    # 문자열 폴백
    return "429" in str(exc) and "rate limit" in str(exc).lower()

# 지역 옵션 (검수 DB 기준)
REGIONS = [
    "서울", "경기도", "인천",
    "충청도", "전라도", "경상도", "강원도", "제주도",
    "전국", "광주", "울산", "부산", "세종", "대구", "대전",
]

# 수도권 필터링용
METRO_REGIONS = {"서울", "경기도", "인천"}

# 주소 → 지역 매핑 (지역 분류 보정용)
_ADDRESS_REGION_MAP: dict[str, str] = {
    "서울": "서울", "서울시": "서울", "서울특별시": "서울",
    "경기": "경기도", "경기도": "경기도",
    "인천": "인천", "인천시": "인천", "인천광역시": "인천",
    "부산": "부산", "부산시": "부산", "부산광역시": "부산",
    "대구": "대구", "대구시": "대구", "대구광역시": "대구",
    "대전": "대전", "대전시": "대전", "대전광역시": "대전",
    "광주": "광주", "광주시": "광주", "광주광역시": "광주",
    "울산": "울산", "울산시": "울산", "울산광역시": "울산",
    "세종": "세종", "세종시": "세종", "세종특별자치시": "세종",
    "충북": "충청도", "충남": "충청도", "충청북도": "충청도", "충청남도": "충청도",
    "전북": "전라도", "전남": "전라도", "전라북도": "전라도", "전라남도": "전라도",
    "전북특별자치도": "전라도",
    "경북": "경상도", "경남": "경상도", "경상북도": "경상도", "경상남도": "경상도",
    "강원": "강원도", "강원도": "강원도", "강원특별자치도": "강원도",
    "제주": "제주도", "제주도": "제주도", "제주특별자치도": "제주도",
}


def format_phone(raw: str) -> str:
    """숫자만 있는 전화번호에 하이픈을 추가한다.

    01012345678 → 010-1234-5678
    0212345678  → 02-1234-5678
    05512345678 → 055-1234-5678
    """
    if not raw:
        return ""
    digits = re.sub(r"\D", "", raw)
    if not digits.startswith("0") or len(digits) < 9:
        return raw

    if digits.startswith("02"):
        # 서울: 02-XXXX-XXXX (10자리) 또는 02-XXX-XXXX (9자리)
        area, rest = digits[:2], digits[2:]
    elif digits[:3] in ("010", "011", "016", "017", "018", "019", "070"):
        # 모바일/인터넷전화(070): 0XX-XXXX-XXXX
        area, rest = digits[:3], digits[3:]
    elif digits[:3] == "050" and len(digits) >= 11:
        # 인터넷전화(050X): 0507-XXXX-XXXX 등 (4자리 식별번호)
        area, rest = digits[:4], digits[4:]
    else:
        # 지역번호 3자리: 031, 055 등
        area, rest = digits[:3], digits[3:]

    if len(rest) <= 4:
        return f"{area}-{rest}"
    mid = rest[:-4]
    last = rest[-4:]
    return f"{area}-{mid}-{last}"


def infer_region_from_address(address: str) -> str:
    """주소 문자열에서 시/도를 추출하여 REGIONS에 매핑한다."""
    if not address:
        return ""
    # 첫 번째 토큰(시/도)으로 매핑 시도
    for token in address.replace(",", " ").split():
        if token in _ADDRESS_REGION_MAP:
            return _ADDRESS_REGION_MAP[token]
    return ""

SYSTEM_PROMPT = """\
당신은 한국 건설/인테리어 업계 전문가입니다.
주어진 기술자(업체) 정보를 분석하여 구조화된 데이터를 추출합니다.

## 추출 항목

### 1. name (업체명)
- 블로그 닉네임이 아닌 **실제 상호명/업체명**을 본문에서 찾아 추출
- 예: "바른정타일", "케이종합공사"
- 찾을 수 없으면 빈 문자열

### 2. trades (시공분야, 최대 3개)
아래 목록에서만 선택:
{trades}
- 본문의 **주력 시공분야**를 기준으로 선택 (단순 언급이 아닌 실제 수행 업무)
- 매칭 불가 시 "기타"

### 3. rank (직급)
- 반장: 소개란에서 본인이 "반장", "팀장", "대표" 등으로 명시한 경우만
- 기공: 일반 기능공으로 명시적 단서가 있을 때
- 준기공/조공: 명시적 단서가 있을 때만
- **확신이 없으면 빈 문자열** (잘못 분류하느니 비워두는 것이 낫다)
- 주의: 사업자등록번호·업체명만으로 반장 판단 금지

### 4. region (지역)
아래 목록에서 선택: {regions}
- 시공 가능 지역이나 소재지 기준
- 여러 지역이면 주요 지역 1개

### 5. address (주소)
- 사업장/사무실 소재지 주소를 추출
- 패턴 예시: "서울시 강남구 역삼동 123-4", "경기도 수원시 팔달구", "서울 마포구"
- 시공 현장 주소가 아닌 **업체 소재지**를 우선
- "서울/경기 시공 가능" 같은 서비스 지역은 address가 아닌 region으로

### 6. phone (연락처)
- 블로그 운영자/업체 본인의 대표 연락처만 추출
- 시공 사례 속 고객 번호, 협력업체 번호, 제조사 번호는 제외
- 형식: 숫자만 (예: "01012345678")
- 확실하지 않으면 빈 문자열

### 7. email (이메일)
- 업체/기술자 본인의 이메일 주소
- 찾을 수 없으면 빈 문자열

### 8. representative (대표자)
- 대표자/대표이사 이름
- "OOO 대표", "대표이사 OOO" 등의 패턴에서 추출
- 찾을 수 없으면 빈 문자열

### 9. business_number (사업자등록번호)
- "000-00-00000" 형식의 사업자등록번호
- 찾을 수 없으면 빈 문자열

### 10. is_professional (전문업자 여부)
- true: 건설/인테리어 시공을 직접 수행하는 전문 기술자 또는 업체
- false: DIY 블로거, 제품 리뷰어, 인테리어 정보 블로거, 일반인, 자재 판매만 하는 업체
- 판단 기준: 직접 시공을 수행하는지, 팀/인력을 보유하는지, 시공 사례가 있는지

## 응답 형식 (JSON만, 설명 없이)
{{"name": "", "trades": [], "rank": "", "region": "", "address": "", "phone": "", "email": "", "representative": "", "business_number": "", "is_professional": true}}
""".format(trades=", ".join(TRADES), regions=", ".join(REGIONS))

# 수동 모드 파일 경로
PENDING_FILE = Path("pending_classification.json")
CLASSIFIED_FILE = Path("classified.json")


def _empty_result() -> dict:
    """빈 분류 결과."""
    return {
        "name": "", "trades": ["기타"], "rank": "", "region": "",
        "address": "", "phone": "", "email": "", "representative": "", "business_number": "",
        "is_professional": True,
    }


def _validate_result(result: dict) -> dict:
    """LLM 결과를 검증하고 정규화한다."""
    result["trades"] = [t for t in result.get("trades", []) if t in TRADES][:3]
    if not result["trades"]:
        result["trades"] = ["기타"]
    rank = result.get("rank", "")
    result["rank"] = rank if rank in RANKS else ""
    result.setdefault("name", "")
    result.setdefault("region", "")
    result.setdefault("address", "")
    result.setdefault("email", "")
    result.setdefault("representative", "")
    result.setdefault("business_number", "")
    # phone: 숫자 추출 → 하이픈 포매팅
    raw_phone = result.get("phone", "")
    digits = raw_phone.replace("-", "").replace(".", "").replace(" ", "") if raw_phone else ""
    result["phone"] = format_phone(digits)
    # 전문업자 여부 정규화
    result.setdefault("is_professional", True)
    result["is_professional"] = bool(result["is_professional"])
    return result


_NO_USAGE = {"input_tokens": 0, "output_tokens": 0}


async def classify(
    name: str,
    about: str,
    headline: str = "",
) -> tuple[dict, dict]:
    """기술자 텍스트 정보를 분석하여 (분류 결과, 토큰 사용량)을 반환한다.

    우선순위: Anthropic API → OpenAI API → 수동 JSON 모드

    Returns:
        (classification, usage) — usage = {"input_tokens": int, "output_tokens": int}
    """
    for attempt in range(_LLM_MAX_RETRIES):
        async with _llm_semaphore:
            await _llm_throttle()
            try:
                if settings.anthropic_api_key:
                    return await _classify_with_anthropic(name, about, headline)
                if settings.openai_api_key and settings.openai_api_key != "skip":
                    return await _classify_with_openai(name, about, headline)
            except Exception as exc:
                if _is_rate_limit_error(exc) and attempt < _LLM_MAX_RETRIES - 1:
                    wait = 2 ** attempt * 5  # 5, 10, 20초
                    log.warning("LLM 429 — %s초 대기 후 재시도 (%d/%d)", wait, attempt + 1, _LLM_MAX_RETRIES)
                    await asyncio.sleep(wait)
                    continue
                raise

    log.info("LLM 미설정 — 수동 분류 모드 (pending_classification.json 확인)")
    return _empty_result(), _NO_USAGE


async def _classify_with_anthropic(name: str, about: str, headline: str = "") -> tuple[dict, dict]:
    """Anthropic Claude API로 분류."""
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key, max_retries=0)
    user_content = f"업체명(블로그닉네임): {name}\n한줄소개: {headline}\n소개:\n{about}"

    resp = await client.messages.create(
        model=settings.anthropic_model,
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
        temperature=0.1,
    )

    text = resp.content[0].text.strip()
    # JSON 블록 추출 (```json ... ``` 감싸기 대응)
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    result = json.loads(text)
    usage = {"input_tokens": resp.usage.input_tokens, "output_tokens": resp.usage.output_tokens}
    return _validate_result(result), usage


async def _classify_with_openai(name: str, about: str, headline: str = "") -> tuple[dict, dict]:
    """OpenAI API로 분류."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key, max_retries=0)
    user_content = f"업체명(블로그닉네임): {name}\n한줄소개: {headline}\n소개:\n{about}"

    resp = await client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        temperature=0.1,
    )

    result = json.loads(resp.choices[0].message.content)
    usage = {
        "input_tokens": resp.usage.prompt_tokens,
        "output_tokens": resp.usage.completion_tokens,
    }
    return _validate_result(result), usage


VISION_PROMPT = """\
이 이미지는 한국 건설/인테리어 업체의 블로그 배너입니다.
이미지에 보이는 텍스트 정보를 추출하세요.

추출할 항목 (보이는 것만):
- phone: 전화번호 (숫자만, 예: "01012345678")
- email: 이메일 주소
- business_number: 사업자등록번호 (000-00-00000)
- representative: 대표자 이름
- address: 주소

JSON만 응답 (설명 없이):
{"phone": "", "email": "", "business_number": "", "representative": "", "address": ""}
"""


def _parse_json_response(text: str) -> dict | None:
    """LLM 응답에서 JSON을 추출한다. 실패 시 None."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


async def extract_text_from_image(image_url: str) -> tuple[dict, dict]:
    """배너 이미지에서 연락처·사업자정보를 Vision API로 추출한다.

    classify()와 동일한 폴백 패턴: Anthropic → OpenAI → 스킵

    Returns:
        (extracted_dict, usage_dict) — 추출 실패 시 빈 dict
    """
    if not image_url:
        return {}, _NO_USAGE

    import base64
    from crawler.channels.naver_blog import _get_client as _get_http_client

    # 이미지 다운로드
    try:
        resp = await _get_http_client().get(image_url)
        resp.raise_for_status()
    except Exception:
        log.warning("배너 이미지 다운로드 실패: %s", image_url)
        return {}, _NO_USAGE

    image_data = base64.standard_b64encode(resp.content).decode("utf-8")
    media_type = resp.headers.get("content-type", "image/jpeg")

    extracted, usage = None, _NO_USAGE
    for attempt in range(_LLM_MAX_RETRIES):
        async with _llm_semaphore:
            await _llm_throttle(vision=True)
            try:
                if settings.anthropic_api_key:
                    extracted, usage = await _vision_with_anthropic(image_data, media_type)
                elif settings.openai_api_key and settings.openai_api_key != "skip":
                    extracted, usage = await _vision_with_openai(image_data, media_type)
                else:
                    return {}, _NO_USAGE
                break
            except Exception as exc:
                if _is_rate_limit_error(exc) and attempt < _LLM_MAX_RETRIES - 1:
                    wait = 2 ** attempt * 5
                    log.warning("Vision 429 — %s초 대기 후 재시도 (%d/%d)", wait, attempt + 1, _LLM_MAX_RETRIES)
                    await asyncio.sleep(wait)
                    continue
                raise

    if not extracted:
        return {}, usage

    # phone 정규화 + 하이픈 포매팅
    raw_phone = extracted.get("phone", "")
    digits = raw_phone.replace("-", "").replace(".", "").replace(" ", "") if raw_phone else ""
    extracted["phone"] = format_phone(digits)
    return extracted, usage


async def _vision_with_anthropic(image_data: str, media_type: str) -> tuple[dict | None, dict]:
    """Anthropic Claude Vision으로 이미지 텍스트 추출."""
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key, max_retries=0)
    resp = await client.messages.create(
        model=settings.anthropic_model,
        max_tokens=256,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_data}},
                {"type": "text", "text": VISION_PROMPT},
            ],
        }],
        temperature=0.0,
    )

    usage = {"input_tokens": resp.usage.input_tokens, "output_tokens": resp.usage.output_tokens}
    extracted = _parse_json_response(resp.content[0].text)
    if not extracted:
        log.warning("Vision 응답 JSON 파싱 실패: %s", resp.content[0].text[:200])
    return extracted, usage


async def _vision_with_openai(image_data: str, media_type: str) -> tuple[dict | None, dict]:
    """OpenAI Vision으로 이미지 텍스트 추출."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key, max_retries=0)
    resp = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{image_data}"}},
                {"type": "text", "text": VISION_PROMPT},
            ],
        }],
        temperature=0.0,
        max_tokens=256,
    )

    usage = {"input_tokens": resp.usage.prompt_tokens, "output_tokens": resp.usage.completion_tokens}
    extracted = _parse_json_response(resp.choices[0].message.content)
    if not extracted:
        log.warning("Vision 응답 JSON 파싱 실패: %s", resp.choices[0].message.content[:200])
    return extracted, usage


async def save_pending(items: list[dict]) -> Path:
    """크롤링 결과를 수동 분류용 JSON으로 저장한다."""
    PENDING_FILE.write_text(json.dumps(items, ensure_ascii=False, indent=2))
    log.info("수동 분류 대기: %s (%d건)", PENDING_FILE, len(items))
    return PENDING_FILE


def load_classified() -> list[dict] | None:
    """수동 분류 완료된 JSON을 로드한다."""
    if not CLASSIFIED_FILE.exists():
        return None
    data = json.loads(CLASSIFIED_FILE.read_text())
    return [_validate_result(item) for item in data]
