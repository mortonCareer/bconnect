from pydantic import BaseModel

# 노션 서비스정책문서 SSOT — 25개 + 기타
TRADES = [
    "설계", "철거/확장", "전기", "배관", "설비",
    "조적", "목공", "창호", "방수", "미장", "단열",
    "타일", "줄눈", "도장", "도배", "필름·시트", "마루", "장판",
    "싱크대", "가구", "에어컨",
    "양중/곰방", "운송", "청소", "보통인부",
    "기타",
]

RANKS = ["반장", "기공", "준기공", "조공"]


class Technician(BaseModel):
    """통합 DB 레코드 1건에 대응하는 모델."""

    name: str                          # 업체명
    representative: str = ""           # 대표자
    rank: str = "기공"                  # 구분 (기본값: 기공)
    trades: list[str] = []             # 시공분야 (SSOT 기준)
    region: str = ""                   # 지역
    address: str = ""                  # 주소
    phone: str = ""                    # 연락처
    email: str = ""                    # 이메일
    business_number: str = ""          # 사업자등록번호
    experience: int | None = None      # 경력 (년)
    credentials: list[str] = []        # 인증
    detail_url: str = ""               # 자세히보기
    channels: list[str] = []           # 수집 채널

    # 본문 콘텐츠 (노션 페이지 body에 저장)
    headline: str = ""                 # 한줄소개 (인스타)
    about: str = ""                    # 소개 (네이버블로그)
    cover_image_url: str = ""          # 대표이미지 → 페이지 커버
    source_urls: list[str] = []        # 출처 URL (개인정보보호법)
