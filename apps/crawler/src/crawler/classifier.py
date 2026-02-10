"""기술자 분류 — LLM(Anthropic/OpenAI) 또는 수동 JSON 모드."""

import json
import logging
from pathlib import Path

from crawler.config import settings
from crawler.models import TRADES, RANKS

log = logging.getLogger(__name__)

# 지역 옵션
REGIONS = ["서울", "경기도", "인천", "충청도", "전라도", "경상도", "강원도", "제주도"]

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
- 반장: 팀/업체를 운영 (예: "OO공사", 대표, 팀장, 직원 보유)
- 기공: 기본값
- 준기공/조공: 명시적 단서가 있을 때만

### 4. region (지역)
아래 목록에서 선택: {regions}
- 시공 가능 지역이나 소재지 기준
- 여러 지역이면 주요 지역 1개

### 5. address (주소)
- 본문에 구체적 주소가 있으면 추출
- 없으면 빈 문자열

### 6. phone (연락처)
- 블로그 운영자/업체 본인의 대표 연락처만 추출
- 시공 사례 속 고객 번호, 협력업체 번호, 제조사 번호는 제외
- 형식: 숫자만 (예: "01012345678")
- 확실하지 않으면 빈 문자열

## 응답 형식 (JSON만, 설명 없이)
{{"name": "", "trades": [], "rank": "기공", "region": "", "address": "", "phone": ""}}
""".format(trades=", ".join(TRADES), regions=", ".join(REGIONS))

# 수동 모드 파일 경로
PENDING_FILE = Path("pending_classification.json")
CLASSIFIED_FILE = Path("classified.json")


def _empty_result() -> dict:
    """빈 분류 결과."""
    return {"name": "", "trades": ["기타"], "rank": "기공", "region": "", "address": "", "phone": ""}


def _validate_result(result: dict) -> dict:
    """LLM 결과를 검증하고 정규화한다."""
    result["trades"] = [t for t in result.get("trades", []) if t in TRADES][:3]
    if not result["trades"]:
        result["trades"] = ["기타"]
    result["rank"] = result.get("rank", "기공") if result.get("rank") in RANKS else "기공"
    result.setdefault("name", "")
    result.setdefault("region", "")
    result.setdefault("address", "")
    # phone: 숫자 이외 문자 제거
    raw_phone = result.get("phone", "")
    result["phone"] = raw_phone.replace("-", "").replace(".", "").replace(" ", "") if raw_phone else ""
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
    if settings.anthropic_api_key:
        return await _classify_with_anthropic(name, about, headline)

    if settings.openai_api_key and settings.openai_api_key != "skip":
        return await _classify_with_openai(name, about, headline)

    log.info("LLM 미설정 — 수동 분류 모드 (pending_classification.json 확인)")
    return _empty_result(), _NO_USAGE


async def _classify_with_anthropic(name: str, about: str, headline: str = "") -> tuple[dict, dict]:
    """Anthropic Claude API로 분류."""
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
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

    client = AsyncOpenAI(api_key=settings.openai_api_key)
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
