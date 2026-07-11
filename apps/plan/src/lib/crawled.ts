import { TRADE_LABELS } from '@bconnect/api-client'
import type { CrawledRegion, Trade } from '@bconnect/api-client'

// 크롤링 프로필의 trades 는 한국어 라벨 문자열 — Trade enum 역매핑.
// 크롤러 표기("필름·시트")와 라벨 표기("필름/시트")의 구분자 차이를 정규화로 흡수.
const normalizeTradeLabel = (label: string) => label.replace(/[·ㆍ]/g, '/')

const TRADE_BY_LABEL: Record<string, Trade> = Object.fromEntries(
  Object.entries(TRADE_LABELS).map(([trade, label]) => [normalizeTradeLabel(label), trade as Trade])
)

export function toTradeEnum(label: string): Trade | undefined {
  return TRADE_BY_LABEL[normalizeTradeLabel(label)]
}

// CrawledRegion enum → 지역 필터 표기 (FilterBar REGION_OPTIONS 와 동일한 시/도 축약)
export const CRAWLED_REGION_LABELS: Record<CrawledRegion, string> = {
  SEOUL: '서울',
  BUSAN: '부산',
  DAEGU: '대구',
  INCHEON: '인천',
  GWANGJU: '광주',
  DAEJEON: '대전',
  ULSAN: '울산',
  SEJONG: '세종',
  GYEONGGI: '경기',
  GANGWON: '강원',
  CHUNGBUK: '충북',
  CHUNGNAM: '충남',
  JEONBUK: '전북',
  JEONNAM: '전남',
  GYEONGBUK: '경북',
  GYEONGNAM: '경남',
  JEJU: '제주',
}
