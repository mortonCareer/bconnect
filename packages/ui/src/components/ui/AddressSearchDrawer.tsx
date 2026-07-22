/**
 * @figma-pending 주소 검색 드로어 — 시안 미정
 */
'use client'

import { AddressSearchEmbed, type AddressSearchResult } from './AddressSearchEmbed'
import { Drawer, DrawerContent, DrawerTitle } from './shadcn/drawer'

export type { AddressSearchResult }

interface AddressSearchDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 사용자가 주소를 선택했을 때 raw 결과 반환 (매핑은 호출부 책임) */
  onComplete: (data: AddressSearchResult) => void
}

/**
 * 카카오 우편번호 선택기를 하단 드로어로 띄운다 (모바일/career). shadcn Drawer(vaul) 가 드래그 닫기·포커스 트랩·ESC·스크롤 잠금·aria 처리.
 * 데스크톱(plan)은 AddressSearchDialog 사용. 열렸을 때만 embed mount (불필요한 iframe/스크립트 로드 방지).
 */
export function AddressSearchDrawer({ open, onOpenChange, onComplete }: AddressSearchDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-describedby={undefined} className="pb-[env(safe-area-inset-bottom)]">
        <DrawerTitle className="px-4 py-3 text-m-16 text-gray-900">주소 검색</DrawerTitle>
        {open && (
          <AddressSearchEmbed
            onComplete={(data) => {
              onComplete(data)
              onOpenChange(false)
            }}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}
