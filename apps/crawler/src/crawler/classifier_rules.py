"""값싼 고정밀 규칙 선필터 (#915).

LLM 분류 전에, 확실한 비-기술자만 규칙으로 먼저 걸러낸다. 잘못 거르는 일이 거의
없도록 신호를 좁게 잡고, 애매하면 걸러내지 않고(None) LLM 분류에 맡긴다.
정답표(gold) 614건으로 검증하며, 잘못 거른 것(false reject)이 0에 가깝도록 유지한다.
"""

import re

# 협찬·후기 명시 문구 — 스폰서 글임을 밝힌 것(거의 확실히 업체 본인 계정 아님)
_DISCLOSURE = re.compile(
    r"(?:소정의\s*)?(?:고료|원고료|포인트|수수료|콘텐츠\s*제작비|제작비|원고비)\s*를?\s*(?:지급|지원|제공)\s*받[아았]"
    r"|협찬\s*(?:및\s*광고\s*)?문의"
    r"|업체(?:로)?부터\s*(?:소정의\s*)?[^\n]{0,8}(?:지급|지원|제공)\s*받",
)

# 자동차 업종 — 판금도색 공업사·정비 등 (건설/인테리어 아님).
# "자동차 유리/썬팅" 같은 약한 단어는 건축필름·유리 업체가 "우린 자동차 안 함"으로
# 언급하다 오격추되므로 제외하고, 자동차 정체성이 뚜렷한 단어만 쓴다.
_AUTOMOTIVE = re.compile(
    r"모터스|오토모빌|판금\s*도색|판금\s*도장|머플러|마후라|리어모니터|에바\s*크리닝"
    r"|(?:자동차|수입차|1급)\s*(?:종합\s*)?공업사"
    r"|자동차\s*(?:사고\s*수리|정비|튜닝|탁송)",
)

# 인력 중개·파견 (시공 기술자 본인이 아니라 인력을 대는 사무소)
_LABOR = re.compile(r"인력\s*(?:사무소|파견|공급|중개)|인력사무소|보통\s*인부\s*(?:투입|파견)|일용\s*인력\s*매칭")

# 경매·노무·행정·교육·시험 (건설 시공이 아닌 서비스).
# "변호사"·"부동산"·"공인중개사"는 시공업체가 고객 유형으로 언급하거나 겸업하는 경우가
# 있어 오격추 위험 → 제외하고 LLM 판단에 맡긴다.
_NON_TRADE_BIZ = re.compile(
    r"법원\s*경매|경매\s*전문\s*기업|노무\s*법인|행정사\s*사무소|세무\s*법인"
    r"|건설업\s*(?:양도|양수|양도양수|등록\s*대행)|건설\s*면허\s*(?:양도|등록\s*대행)|기업진단\s*전문"
    r"|직업\s*전문\s*학교|기술사\s*학원|직업능력개발원|건설기초안전교육"
    r"|품질\s*시험(?:원|소)|지반\s*조사\s*전문|측량\s*기술단",
)

# 화물운송·탁송 (시공 아님). 건설기계 임대는 포장·토목 업체가 부가로 하는 경우가 많아
# 제외하고, 운송·탁송·물류 중개처럼 시공과 무관한 것만 쓴다.
_RENTAL_FREIGHT = re.compile(
    r"화물\s*운송|용차\s*전문|오토바이\s*탁송|바이크\s*탁송|물류\s*(?:중개|컨설팅|일자리)",
)

# POS·결제기기·소프트웨어
_POS_SW = re.compile(r"카드\s*단말기|포스\s*(?:기|시스템)|키오스크|테이블\s*오더|CAD\s*(?:자산|유통|공급)")

# 자재 도매·유통, 방역 (건설 시공이 아닌 업종)
_MISC_NONTRADE = re.compile(
    r"도매\s*(?:납품|전문|업)|총판\s*(?:점|업)|건축자재\s*(?:도매|유통)|자재\s*유통\s*전문"
    r"|방역\s*소독|해충\s*(?:방제|퇴치)|돈벌레\s*퇴치",
)

# 협찬·후기 블로거 — 한 줄 소개가 업체가 아니라 개인 블로거 페르소나.
# 한 줄 소개(headline)에만 적용한다. 소개글 본문에 '여행' 같은 단어가 스치는 것으로
# 진짜 업체를 거르지 않기 위함.
_PROMO_PERSONA = re.compile(
    r"여행|일상\s*블로그|워킹맘|육아맘|둥이맘|일기장|블로거\s*입니다|협업\s*문의|체험단|잡동사니|리뷰.*(?:스푼|블로그)|묵상",
)

_RULES = [
    ("promo_review", "협찬 명시 문구", _DISCLOSURE),
    ("out_of_scope", "자동차 업종", _AUTOMOTIVE),
    ("out_of_scope", "인력 중개/파견", _LABOR),
    ("out_of_scope", "부동산/경매/행정/법률/교육", _NON_TRADE_BIZ),
    ("out_of_scope", "장비임대/화물운송", _RENTAL_FREIGHT),
    ("out_of_scope", "POS/소프트웨어", _POS_SW),
    ("out_of_scope", "자재유통/방역", _MISC_NONTRADE),
]


def rule_reject(record: dict) -> tuple[str, str] | None:
    """확실한 비-기술자면 (유형, 사유)를 돌려주고, 애매하면 None(LLM에 위임).

    record 는 company·headline·about(소개글) 키를 쓴다. about 은 앞부분만 본다.
    """
    company = record.get("company") or ""
    headline = record.get("headline") or ""
    about = (record.get("about") or "")[:800]

    # 협찬·후기 블로거: 한 줄 소개가 개인 블로거 페르소나 (headline 에만 적용)
    if _PROMO_PERSONA.search(headline):
        return ("promo_review", "개인 블로거 한 줄 소개")

    hay = f"{company}\n{headline}\n{about}"
    for category, reason, pattern in _RULES:
        if pattern.search(hay):
            return (category, reason)
    return None
