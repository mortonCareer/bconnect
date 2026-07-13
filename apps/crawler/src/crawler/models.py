import re

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

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

# BE CrawledRegion enum ↔ 한국어 시/도 (LLM·주소 추론은 한국어, 저장은 enum)
REGION_ENUM_BY_KR = {
    "서울": "SEOUL", "부산": "BUSAN", "대구": "DAEGU", "인천": "INCHEON",
    "광주": "GWANGJU", "대전": "DAEJEON", "울산": "ULSAN", "세종": "SEJONG",
    "경기": "GYEONGGI", "강원": "GANGWON", "충북": "CHUNGBUK", "충남": "CHUNGNAM",
    "전북": "JEONBUK", "전남": "JEONNAM", "경북": "GYEONGBUK", "경남": "GYEONGNAM",
    "제주": "JEJU",
}
KR_BY_REGION_ENUM = {v: k for k, v in REGION_ENUM_BY_KR.items()}

# BE CrawledPlatform enum ↔ 노션 채널 이름
PLATFORM_NAVER = "NAVER"
PLATFORM_INSTAGRAM = "INSTAGRAM"
CHANNEL_KR_BY_PLATFORM = {
    PLATFORM_NAVER: "네이버블로그",
    PLATFORM_INSTAGRAM: "인스타그램",
}

# BE CrawledCredentialType enum
CREDENTIAL_TYPES = ["EDUCATION", "CERTIFICATE", "AWARD", "LICENSE"]

# 검색 키워드 — 세부 시공분야 (이송목 제공)
# 이 키워드로 검색 후, LLM이 SSOT 25개 중 하나로 매핑한다.
SEARCH_KEYWORDS = [
    "설계", "철거", "확장", "토공", "포장", "보링", "발파", "측량",
    "내선전기", "외선전기",
    "건축배관", "상하수도배관",
    "건축기계설비", "보일러", "공조",
    "조적",
    "형틀목공", "건축목공", "경량철골",
    "창호", "샷시", "유리",
    "방수", "미장", "견출",
    "단열", "보온", "패널조립", "수장",
    "타일", "줄눈",
    "도장", "도배",
    "필름", "시트",
    "마루", "장판",
    "실리콘", "코킹", "지붕잇기",
    "철근", "콘크리트", "강구조", "철골", "비계",
    "석공", "금속", "철공", "용접", "제관", "함석", "판금", "덕트",
    "싱크대", "가구", "에어컨", "위생도기",
    "조경", "소방", "정보통신", "안전관리",
    "건설기계운전", "양중", "곰방", "목도",
    "운송", "청소", "보통인부",
]


def phone_digits(raw: str) -> str:
    """전화번호를 BE 저장 포맷(숫자만)으로 정규화한다. 예: 010-1234-5678 → 01012345678"""
    return re.sub(r"\D", "", raw or "")


class _CamelModel(BaseModel):
    """BE 계약(JSON camelCase)과 동형으로 직렬화되는 베이스."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    def dump(self) -> dict:
        return self.model_dump(by_alias=True)


class CrawledPost(_CamelModel):
    """블로그 글 1건 — BE crawled_posts 행에 대응. source_url은 출처 표기용 메타."""

    title: str = ""
    content: str = ""
    images: list[str] = Field(default_factory=list)
    source_url: str = ""


class CrawledCredential(_CamelModel):
    """인증 1건 — BE crawled_credentials 행에 대응."""

    type: str = "CERTIFICATE"  # CREDENTIAL_TYPES 중 하나
    name: str = ""


class CrawledProfile(_CamelModel):
    """프로필 — BE crawled_profiles 행에 대응."""

    primary_trade: str = ""
    trades: list[str] = Field(default_factory=list)
    experience: int | None = None
    headline: str = ""
    about: str = ""
    address: str = ""
    state: str = ""  # CrawledRegion enum 값, 미상이면 빈 문자열
    url: str = ""  # 프로필 원 URL (블로그 홈 등) — BE unique key
    platform: str = PLATFORM_NAVER


class CrawledMember(_CamelModel):
    """크롤링 기술자 1건 — BE CrawledMemberResponse 동형 + 크롤러 메타(source_urls)."""

    company: str  # 업체명
    name: str = ""  # 대표자
    phone: str = ""
    picture: str = ""  # 대표 이미지 URL
    role: str = ""  # RANKS 중 하나, 빈값이면 적재 시 BE 기본값(반장)
    brn: str = ""  # 사업자등록번호
    email: str = ""
    profile: CrawledProfile = Field(default_factory=CrawledProfile)
    credentials: list[CrawledCredential] = Field(default_factory=list)
    posts: list[CrawledPost] = Field(default_factory=list)
    source_urls: list[str] = Field(default_factory=list)  # 출처 표기용 메타 (BE 스키마 밖)

    @property
    def channel_kr(self) -> str:
        return CHANNEL_KR_BY_PLATFORM.get(self.profile.platform, "네이버블로그")

    @property
    def region_kr(self) -> str:
        return KR_BY_REGION_ENUM.get(self.profile.state, "")
