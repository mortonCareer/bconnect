/**
 * @figma-pending 주소 검색 바텀시트 — 시안 미정
 */
'use client'

import * as Dialog from '@radix-ui/react-dialog'
import KakaoPostcodeEmbed from 'react-daum-postcode'
import type { ComponentProps } from 'react'

/** react-daum-postcode onComplete 가 넘기는 데이터 타입 — export 명에 의존하지 않고 prop 에서 유도 */
export type AddressSearchResult = Parameters<
  NonNullable<ComponentProps<typeof KakaoPostcodeEmbed>['onComplete']>
>[0]

interface AddressSearchSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 사용자가 주소를 선택했을 때 raw 결과 반환 (매핑은 호출부 책임) */
  onComplete: (data: AddressSearchResult) => void
}

/**
 * 카카오 우편번호 선택기를 바텀시트로 띄운다. radix Dialog 가 포커스 트랩·ESC·스크롤 잠금·aria 처리.
 * 열렸을 때만 embed mount (불필요한 iframe/스크립트 로드 방지).
 */
export function AddressSearchSheet({ open, onOpenChange, onComplete }: AddressSearchSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] focus:outline-none"
        >
          <Dialog.Title className="px-4 py-3 text-m-16 text-gray-900">주소 검색</Dialog.Title>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
