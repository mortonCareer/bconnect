/**
 * 지역(시도) 필터 vocabulary.
 *
 * BE Region enum SSOT 합의 전까지 FE 임시 정의 (experience-range FE-first 선례와 동일).
 * BE 합류 시 @bconnect/api-client 의 Region 으로 교체.
 */
export const REGIONS = [
  'SEOUL',
  'BUSAN',
  'DAEGU',
  'INCHEON',
  'GWANGJU',
  'DAEJEON',
  'ULSAN',
  'SEJONG',
  'GYEONGGI',
  'CHUNGBUK',
  'CHUNGNAM',
  'JEONNAM',
  'JEONBUK',
  'GYEONGBUK',
  'GYEONGNAM',
  'GANGWON',
  'JEJU',
] as const

export type Region = (typeof REGIONS)[number]

export const REGION_LABELS: Record<Region, string> = {
  SEOUL: '서울',
  BUSAN: '부산',
  DAEGU: '대구',
  INCHEON: '인천',
  GWANGJU: '광주',
  DAEJEON: '대전',
  ULSAN: '울산',
  SEJONG: '세종',
  GYEONGGI: '경기',
  CHUNGBUK: '충북',
  CHUNGNAM: '충남',
  JEONNAM: '전남',
  JEONBUK: '전북',
  GYEONGBUK: '경북',
  GYEONGNAM: '경남',
  GANGWON: '강원',
  JEJU: '제주',
}
