'use client'

import { useEffect, useRef } from 'react'
import { CloseTab } from '@bconnect/ui'
import { PanelHeader, type PanelHeaderProps } from './PanelHeader'

interface PanelShellProps extends PanelHeaderProps {
  /** 경로는 유지하고 `?panel=` 만 제거하는 href (필터 등 다른 search param 은 보존). */
  closeHref: string
  closeLabel?: string
  /** 닫기를 Link 대신 onClose 버튼으로 — 닫기 가드(미완성 작업 등)가 필요한 패널용. */
  closeAsButton?: boolean
  onClose: () => void
  children: React.ReactNode
}

/**
 * 패널 뷰 공통 레이아웃 — root(마운트 포커스 + Esc 닫기 포함) + 닫기 버튼(CloseTab) + PanelHeader + children.
 * 본문 구조/상태(loading·error·empty)는 강제하지 않고 children 으로 위임한다.
 * 리스트형 뷰는 children 을 `PanelScroll` 로 감싸고, ChatView 처럼 자체 레이아웃이면 자유 조합.
 *
 * 닫기는 `CloseTab` 이 패널 좌측 경계에 걸쳐 떠 있는 형태 (#969) — `PanelAside` 는 클리핑이 없어 밖으로 나온다.
 */
export function PanelShell({
  closeHref,
  closeLabel = '패널 닫기',
  closeAsButton,
  onClose,
  children,
  ...header
}: PanelShellProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    rootRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // 내부 오버레이(Select 드롭다운 등)가 Esc 를 소비(preventDefault)했으면 패널은 유지
      if (e.key === 'Escape' && !e.defaultPrevented) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className="relative flex h-full flex-col bg-white outline-none"
    >
      {/* 시안 실측: 위에서 16, 좌우는 32px 원의 중심이 패널 좌측 경계 위(-translate-x-1/2) */}
      <CloseTab
        aria-label={closeLabel}
        href={closeAsButton ? undefined : closeHref}
        onClick={closeAsButton ? onClose : undefined}
        className="absolute top-4 left-0 z-10 -translate-x-1/2"
      />
      <PanelHeader {...header} />
      {children}
    </div>
  )
}
