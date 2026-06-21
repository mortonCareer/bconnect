/**
 * @figma-pending 주소 검색 다이얼로그 — 시안 미정
 */
'use client'

import { Dialog } from 'radix-ui'
import { AddressSearchEmbed, type AddressSearchResult } from './AddressSearchEmbed'

interface AddressSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 사용자가 주소를 선택했을 때 raw 결과 반환 (매핑은 호출부 책임) */
  onComplete: (data: AddressSearchResult) => void
}

/**
 * 카카오 우편번호 선택기를 중앙 모달로 띄운다 (데스크톱/plan). radix Dialog 가 포커스 트랩·ESC·스크롤 잠금·aria 처리.
 * 모바일(career)은 AddressSearchDrawer 사용. 열렸을 때만 embed mount (불필요한 iframe/스크립트 로드 방지).
 */
export function AddressSearchDialog({ open, onOpenChange, onComplete }: AddressSearchDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-[480px] max-w-[calc(100%-2.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white focus:outline-none"
        >
          <Dialog.Title className="px-4 py-3 text-m-16 text-gray-900">주소 검색</Dialog.Title>
          {open && (
            <AddressSearchEmbed
              onComplete={(data) => {
                onComplete(data)
                onOpenChange(false)
              }}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
