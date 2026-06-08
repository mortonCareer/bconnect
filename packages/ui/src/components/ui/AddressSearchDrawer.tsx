/**
 * @figma-pending 주소 검색 드로어 — 시안 미정
 */
'use client'

import KakaoPostcodeEmbed from 'react-daum-postcode'
import type { ComponentProps } from 'react'
import { Drawer, DrawerContent, DrawerTitle } from './shadcn/drawer'

/** react-daum-postcode onComplete 가 넘기는 데이터 타입 — export 명에 의존하지 않고 prop 에서 유도 */
export type AddressSearchResult = Parameters<
  NonNullable<ComponentProps<typeof KakaoPostcodeEmbed>['onComplete']>
>[0]

interface AddressSearchDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 사용자가 주소를 선택했을 때 raw 결과 반환 (매핑은 호출부 책임) */
  onComplete: (data: AddressSearchResult) => void
}

/**
 * 카카오 우편번호 선택기를 하단 드로어로 띄운다. shadcn Drawer(vaul) 가 드래그 닫기·포커스 트랩·ESC·스크롤 잠금·aria 처리.
 * 열렸을 때만 embed mount (불필요한 iframe/스크립트 로드 방지).
 */
export function AddressSearchDrawer({ open, onOpenChange, onComplete }: AddressSearchDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-describedby={undefined} className="pb-[env(safe-area-inset-bottom)]">
        <DrawerTitle className="px-4 py-3 text-m-16 text-gray-900">주소 검색</DrawerTitle>
        {open && (
          <KakaoPostcodeEmbed
            onComplete={(data) => {
              onComplete(data)
              onOpenChange(false)
            }}
            autoClose={false}
            style={{ width: '100%', height: 480 }}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}
