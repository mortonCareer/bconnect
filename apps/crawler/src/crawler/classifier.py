"""기술자 분류 — LLM 또는 키워드 매칭 폴백."""

import json
import logging

from crawler.config import settings
from crawler.models import TRADES, RANKS, SEARCH_KEYWORDS

log = logging.getLogger(__name__)

# 검색 키워드 → SSOT 매핑 (키워드 매칭 폴백용)
_KEYWORD_TO_TRADE: dict[str, str] = {
    "설계": "설계",
    "철거": "철거/확장", "확장": "철거/확장",
    "토공": "기타", "포장": "기타", "보링": "기타", "발파": "기타", "측량": "설계",
    "내선전기": "전기", "외선전기": "전기",
    "건축배관": "배관", "상하수도배관": "배관",
    "건축기계설비": "설비", "보일러": "설비", "공조": "설비",
    "조적": "조적",
    "형틀목공": "목공", "건축목공": "목공", "경량철골": "기타",
    "창호": "창호", "샷시": "창호", "유리": "창호",
    "방수": "방수", "미장": "미장", "견출": "미장",
    "단열": "단열", "보온": "단열", "패널조립": "단열", "수장": "기타",
    "타일": "타일", "줄눈": "줄눈",
    "도장": "도장", "도배": "도배",
    "필름": "필름·시트", "시트": "필름·시트",
    "마루": "마루", "장판": "장판",
    "실리콘": "기타", "코킹": "기타", "지붕잇기": "기타",
    "철근": "기타", "콘크리트": "기타", "강구조": "기타", "철골": "기타", "비계": "기타",
    "석공": "기타", "금속": "기타", "철공": "기타", "용접": "기타",
    "제관": "기타", "함석": "기타", "판금": "기타", "덕트": "기타",
    "싱크대": "싱크대", "가구": "가구", "에어컨": "에어컨", "위생도기": "설비",
    "조경": "기타", "소방": "기타", "정보통신": "기타", "안전관리": "기타",
    "건설기계운전": "기타", "양중": "양중/곰방", "곰방": "양중/곰방", "목도": "양중/곰방",
    "운송": "운송", "청소": "청소", "보통인부": "보통인부",
}

# 반장 판별 키워드
_BOSS_KEYWORDS = ["공사", "건설", "대표", "팀장", "반장", "직원", "인력"]

SYSTEM_PROMPT = """\
당신은 한국 건설/인테리어 업계 전문가입니다.
주어진 기술자 정보를 분석하여 시공분야와 직급을 판별합니다.

## 시공분야 (최대 3개 선택)
{trades}

## 직급 판별 기준
- 반장: 팀을 운영하는 경우 (예: "OO공사", 직원 보유 언급, 팀장/대표)
- 기공: 기본값 (판별 불가 시)
- 준기공: 명시적 단서가 있는 경우에만
- 조공: 명시적 단서가 있는 경우에만

## 응답 형식 (JSON)
{{"trades": ["시공분야1", "시공분야2"], "rank": "기공"}}

반드시 위 목록에 있는 값만 사용하세요.
매칭되지 않으면 trades에 "기타"를 포함하세요.
""".format(trades=", ".join(TRADES))


def _classify_by_keywords(name: str, about: str, headline: str = "") -> dict:
    """키워드 매칭으로 분류 (LLM 폴백)."""
    text = f"{name} {headline} {about}".lower()

    # 시공분야 매칭
    found_trades: list[str] = []
    for keyword, trade in _KEYWORD_TO_TRADE.items():
        if keyword in text and trade not in found_trades:
            found_trades.append(trade)
    if not found_trades:
        found_trades = ["기타"]

    # 직급 판별
    rank = "기공"
    for kw in _BOSS_KEYWORDS:
        if kw in text:
            rank = "반장"
            break

    return {"trades": found_trades[:3], "rank": rank}


async def classify(
    name: str,
    about: str,
    headline: str = "",
) -> dict:
    """기술자 텍스트 정보를 분석하여 시공분야와 직급을 반환한다.

    LLM API 키가 없으면 키워드 매칭 폴백을 사용한다.
    """
    # LLM 사용 가능하면 LLM으로 분류
    if settings.openai_api_key and settings.openai_api_key != "skip":
        return await _classify_with_llm(name, about, headline)

    # 폴백: 키워드 매칭
    log.info("LLM 미설정 — 키워드 매칭 폴백 사용")
    return _classify_by_keywords(name, about, headline)


async def _classify_with_llm(name: str, about: str, headline: str = "") -> dict:
    """OpenAI API로 분류."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    user_content = f"업체명: {name}\n한줄소개: {headline}\n소개:\n{about}"

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
    result["trades"] = [t for t in result.get("trades", []) if t in TRADES][:3]
    result["rank"] = result.get("rank", "기공") if result.get("rank") in RANKS else "기공"
    return result
