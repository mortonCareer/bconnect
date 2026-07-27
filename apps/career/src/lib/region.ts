/**
 * 지역(시도) 필터 vocabulary.
 *
 * 한글 라벨 SSOT 는 @bconnect/api-client 의 REGION_LABELS (공용 Region 코드 기반).
 * REGIONS 배열은 필터 UI 표시 순서라 앱에서 유지.
 */
export { REGION_LABELS } from '@bconnect/api-client'

export const REGIONS = [
  '서울',
  '부산',
  '대구',
  '인천',
  '전남광주통합특별시',
  '대전',
  '울산',
  '세종특별자치시',
  '경기',
  '충북',
  '충남',
  '전북특별자치도',
  '경북',
  '경남',
  '강원특별자치도',
  '제주특별자치도',
] as const

export type Region = (typeof REGIONS)[number]
