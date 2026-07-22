/**
 * @figma-scaffold 주소 검색 임베드 공유 조각 — Drawer(모바일)·Dialog(데스크톱) 셸이 공통 소비
 */
'use client'

import KakaoPostcodeEmbed from 'react-daum-postcode'
import type { ComponentProps } from 'react'

/** react-daum-postcode onComplete 가 넘기는 데이터 타입 — export 명에 의존하지 않고 prop 에서 유도 */
export type AddressSearchResult = Parameters<
  NonNullable<ComponentProps<typeof KakaoPostcodeEmbed>['onComplete']>
>[0]

/**
 * 카카오 우편번호 선택기 임베드. 선택 시 raw 결과 반환(매핑은 호출부 책임). 셸(Drawer/Dialog)은 소비처가 제공.
 * shorthand 는 라이브러리 기본값에 기대지 않고 명시 핀 — 시/도 정확 일치 목록(#1000)이 축약 표기에 의존.
 */
export function AddressSearchEmbed({
  onComplete,
}: {
  onComplete: (data: AddressSearchResult) => void
}) {
  return (
    <KakaoPostcodeEmbed
      onComplete={onComplete}
      autoClose={false}
      shorthand={true}
      style={{ width: '100%', height: 480 }}
    />
  )
}
