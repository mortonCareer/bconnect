/**
 * 지역(시도) 필터 vocabulary.
 *
 * 한글 라벨 SSOT 는 @bconnect/api-client 의 REGION_LABELS (공용 Region 코드 기반).
 * REGIONS 배열은 필터 UI 표시 순서라 앱에서 유지.
 */
export { REGION_LABELS } from '@bconnect/api-client'

export const REGIONS = [
  'SEOUL',
  'BUSAN',
  'DAEGU',
  'INCHEON',
  'JEONNAM_GWANGJU',
  'DAEJEON',
  'ULSAN',
  'SEJONG',
  'GYEONGGI',
  'CHUNGBUK',
  'CHUNGNAM',
  'JEONBUK',
  'GYEONGBUK',
  'GYEONGNAM',
  'GANGWON',
  'JEJU',
] as const

export type Region = (typeof REGIONS)[number]
