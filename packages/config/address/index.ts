import { regionOfState } from '@bconnect/api-client'
import type { Address, Region } from '@bconnect/api-client'
import { UnknownSidoError } from '../errors/index'

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
 * 입력 중인 주소. 주소 검색 전에는 시/도(state)가 아직 없다 — BE Address 는 state 를 필수로 요구하므로
 * 폼 상태와 전송 페이로드를 같은 타입으로 둘 수 없다. 전송 직전 isCompleteAddress 로 좁힌다.
 */
export type AddressDraft = Omit<Address, 'state'> & { state?: Region }

/** 주소 미선택 상태의 폼 초기값. */
export function emptyAddressDraft(): AddressDraft {
  return {
    zipcode: '',
    street: '',
    state: undefined,
    city: '',
    detail: undefined,
    latitude: 0,
    longitude: 0,
  }
}

/** BE 로 보낼 수 있는 완전한 주소인지 — state/city/street 가 모두 채워졌는지로 판정. */
export function isCompleteAddress(a: AddressDraft | null | undefined): a is Address {
  return a != null && a.state != null && a.city.length > 0 && a.street.length > 0
}

/**
 * 카카오 선택 결과 → BE Address.
 * sido 가 정확 일치 목록(regionOfState) 밖이면 UnknownSidoError — 오분류 주소 저장 차단 게이트.
 * 상세주소(detail)는 선택 결과에 없으므로 undefined — 호출부가 사용자 입력으로 덮어쓴다.
 * latitude/longitude 는 placeholder 0 — 위경도를 0 으로 두는 유일한 지점.
 */
export function mapKakaoAddress(r: KakaoAddressResult): Address {
  // TODO(#280): 위경도는 placeholder 0. 후속 BE-side geocoding(카카오 Local REST)으로 대체.
  const state = regionOfState(r.sido)
  if (state === undefined) {
    throw new UnknownSidoError(r.sido)
  }
  return {
    zipcode: r.zonecode,
    street: r.userSelectedType === 'R' ? r.roadAddress : r.jibunAddress,
    state,
    city: r.sigungu,
    detail: undefined,
    latitude: 0,
    longitude: 0,
  }
}
