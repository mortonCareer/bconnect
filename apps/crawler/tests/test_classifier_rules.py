"""규칙 선필터(classifier_rules) 회귀 테스트.

실제 크롤링 데이터(gold 614)는 저장소에 넣지 않으므로, 각 규칙을 대표하는 최소
예시로 검증한다. 특히 '걸러내면 안 되는' 사례(고객 유형 언급·겸업·부정문)를 지켜
잘못 거르는 일이 생기지 않게 한다.
"""

from crawler.classifier_rules import rule_reject


def _rec(company="", headline="", about=""):
    return {"company": company, "headline": headline, "about": about}


# --- 걸러내야 하는 것 (확실한 비-기술자) ---

def test_reject_disclosure():
    assert rule_reject(_rec(about="본 포스팅은 소정의 원고료를 지급받아 작성되었습니다."))[0] == "promo_review"
    assert rule_reject(_rec(about="업체로부터 콘텐츠 제작비를 지원받아 작성했어요"))[0] == "promo_review"
    assert rule_reject(_rec(headline="협찬 및 광고 문의 seug2580@naver.com"))[0] == "promo_review"


def test_reject_automotive():
    assert rule_reject(_rec(company="1991모터스"))[0] == "out_of_scope"
    assert rule_reject(_rec(company="범퍼뱅크", about="1급 자동차 공업사입니다"))[0] == "out_of_scope"
    assert rule_reject(_rec(about="벤츠 판금도색 사고수리 전문"))[0] == "out_of_scope"
    assert rule_reject(_rec(about="자동차 머플러 용접 전문 시공업체"))[0] == "out_of_scope"


def test_reject_labor_agency():
    assert rule_reject(_rec(headline="건설 인력사무소, 기공/조공/잡부 파견"))[0] == "out_of_scope"


def test_reject_non_trade_biz():
    assert rule_reject(_rec(company="딜라이트노무법인"))[0] == "out_of_scope"
    assert rule_reject(_rec(about="건설업 양도양수, 건설면허 등록대행 전문"))[0] == "out_of_scope"
    assert rule_reject(_rec(company="한국건설직업전문학교"))[0] == "out_of_scope"
    assert rule_reject(_rec(about="법원 경매 전문 기업 두레옥션"))[0] == "out_of_scope"


def test_reject_freight():
    assert rule_reject(_rec(about="전국 화물운송 24시 배차 전문"))[0] == "out_of_scope"
    assert rule_reject(_rec(company="바이크프로", about="오토바이 탁송 전문"))[0] == "out_of_scope"


def test_reject_pos():
    assert rule_reject(_rec(about="카드단말기 포스 키오스크 테이블오더 전문"))[0] == "out_of_scope"


# --- 걸러내면 안 되는 것 (진짜 기술자인데 위험 단어를 스치는 경우) ---

def test_keep_client_mention_lawyer():
    # 인테리어 업체가 '변호사 사무실'을 고객으로 언급 — 걸러내면 안 됨
    assert rule_reject(_rec(company="공감98프로디자인", about="서초동 변호사 사무실 유리칸막이 시공")) is None


def test_keep_realtor_side_business():
    # 부동산 겸업이지만 도배/실리콘 시공을 직접 하는 계정 — 걸러내면 안 됨
    assert rule_reject(_rec(company="리치온 공인중개사", about="시흥시 벽지 도배 시공 전문")) is None


def test_keep_negated_automotive():
    # 건축용 필름 업체가 '자동차 썬팅은 안 한다'고 밝힌 경우 — 걸러내면 안 됨
    assert rule_reject(_rec(company="올필름", about="자동차 썬팅은 전문도 아니고 안 합니다. 건축용 필름만.")) is None


def test_keep_exterior_restore_home_repair():
    # 집수리의 '외형복원'(벽 보수) — 자동차 아님, 걸러내면 안 됨
    assert rule_reject(_rec(company="집수리종이나라", about="석고벽 보수제로 메꾸어 외형복원 후 부분도배")) is None


def test_keep_equipment_rental_by_paving():
    # 아스콘 포장 업체가 부가로 장비 임대 — 걸러내면 안 됨
    assert rule_reject(_rec(company="모아건설", about="아스콘 포장, 건설기계 임대도 함께")) is None


def test_reject_promo_persona():
    # 한 줄 소개가 개인 블로거 페르소나 → 협찬/후기 블로거
    assert rule_reject(_rec(headline="맛집·여행·일상을 기록하는 감성 블로거입니다"))[0] == "promo_review"
    assert rule_reject(_rec(headline="맛집, 카페 좋아하는 워킹맘 = 디자이너, 협업 문의"))[0] == "promo_review"
    assert rule_reject(_rec(headline="여행하며 생각하며, 하고 싶은 거 하면서"))[0] == "promo_review"


def test_reject_material_and_pest():
    assert rule_reject(_rec(about="타일 위생도기 도매 납품 전문"))[0] == "out_of_scope"
    assert rule_reject(_rec(company="온누리방역소독", about="돈벌레 퇴치 방역 소독 전문"))[0] == "out_of_scope"


def test_keep_default_naver_headline():
    # 네이버 기본 소개 템플릿의 '맛집' — 실제 공조 업체가 방치한 것, 걸러내면 안 됨
    hl = "직접 다녀온 맛집 후기부터 일상 속 소소한 이야기까지 기록하는 공간이에요."
    assert rule_reject(_rec(company="경인아이티에스", headline=hl, about="공조시스템 전문업체입니다")) is None


def test_keep_seoichu_phrase():
    # '서이추'(서로이웃 추가) 같은 일반 블로그 관용어 — 진짜 업체도 씀, 걸러내면 안 됨
    assert rule_reject(_rec(company="집수리어때", headline="하자보수 타일보수 전문업체, 서이추 좋아요")) is None


def test_keep_plain_pro():
    assert rule_reject(_rec(company="바른정타일", about="욕실 타일 시공 100% 직접 시공")) is None
