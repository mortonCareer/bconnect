"""LLM 기반 기술자 분류 — 시공분야 및 직급 판별."""

import json

from openai import AsyncOpenAI

from crawler.config import settings
from crawler.models import TRADES, RANKS

client = AsyncOpenAI(api_key=settings.openai_api_key)

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


async def classify(
    name: str,
    about: str,
    headline: str = "",
) -> dict:
    """기술자 텍스트 정보를 분석하여 시공분야와 직급을 반환한다.

    Returns:
        {"trades": ["타일", "줄눈"], "rank": "반장"}
    """
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

    # 유효성 검증: 허용된 값만 통과
    result["trades"] = [t for t in result.get("trades", []) if t in TRADES][:3]
    result["rank"] = result.get("rank", "기공") if result.get("rank") in RANKS else "기공"

    return result
