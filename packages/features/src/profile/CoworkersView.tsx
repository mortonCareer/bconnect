'use client'

import type { Coworker } from '@bconnect/api-client'
import { PanelShell } from '../_shared/PanelShell'
import { PanelScroll } from '../_shared/PanelScroll'
import { CoworkerList } from './CoworkerList'

/** 앱이 resolve 해 내려주는 데이터. plan 어댑터가 useGetCoworkers(by-id) 로 채운다. */
export interface CoworkersViewData {
  coworkers?: Coworker[]
  isLoading: boolean
  isError: boolean
}

export interface CoworkersViewProps {
  data: CoworkersViewData
  closeHref: string
  onClose: () => void
  /** 부모(프로필) 패널로 복귀 */
  backHref: string
  /** 동료 클릭 시 그 동료 프로필 패널/페이지 href — 앱이 주입 (plan: panelHref) */
  coworkerHref: (profileId: number) => string
}

export function CoworkersView({
  data,
  closeHref,
  onClose,
  backHref,
  coworkerHref,
}: CoworkersViewProps) {
  const { coworkers, isLoading, isError } = data

  return (
    <PanelShell
      title="동료"
      backHref={backHref}
      backLabel="프로필"
      closeLabel="동료 패널 닫기"
      closeHref={closeHref}
      onClose={onClose}
    >
      <PanelScroll>
        <CoworkerList
          coworkers={coworkers}
          isLoading={isLoading}
          isError={isError}
          coworkerHref={coworkerHref}
        />
      </PanelScroll>
    </PanelShell>
  )
}
