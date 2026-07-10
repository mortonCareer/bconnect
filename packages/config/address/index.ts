import type { Address } from '@bconnect/api-client'

/** 카카오 우편번호 oncomplete 결과 중 우리가 읽는 부분집합 (react-daum-postcode 결과와 구조 호환) */
export interface KakaoAddressResult {
  zonecode: string
  roadAddress: string
  jibunAddress: string
  userSelectedType: 'R' | 'J'
  sido: string
  sigungu: string
}

/**
 * 카카오 선택 결과 → BE Address. r 이 null 이면 빈 placeholder Address(주소 미선택 fallback).
 * 상세주소(detail)는 선택 결과에 없으므로 undefined — 호출부가 사용자 입력으로 덮어쓴다.
 * latitude/longitude 는 placeholder 0 — 위경도를 0 으로 두는 유일한 지점.
 */
export function mapKakaoAddress(r: KakaoAddressResult | null): Address {
  // TODO(#280): 위경도는 placeholder 0. 후속 BE-side geocoding(카카오 Local REST)으로 대체.
  const latitude = 0
  const longitude = 0
  if (!r) {
    return { zipcode: '', street: '', state: '', city: '', detail: undefined, latitude, longitude }
  }
  return {
    zipcode: r.zonecode,
    street: r.userSelectedType === 'R' ? r.roadAddress : r.jibunAddress,
    state: r.sido,
    city: r.sigungu,
    detail: undefined,
    latitude,
    longitude,
  }
}
