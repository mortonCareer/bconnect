'use client'

import { PanelHeader, type PanelHeaderProps } from './PanelHeader'
import { usePanelDismiss } from './usePanelDismiss'

interface PanelShellProps extends PanelHeaderProps {
  onClose: () => void
  children: React.ReactNode
}

/**
 * `@panel` 뷰 공통 레이아웃 — root(focus+Esc 포함) + PanelHeader + children.
 * 본문 구조/상태(loading·error·empty)는 강제하지 않고 children 으로 위임한다.
 * 리스트형 뷰는 children 을 `PanelScroll` 로 감싸고, ChatView 처럼 자체 레이아웃이면 자유 조합.
 */
export function PanelShell({ onClose, children, ...header }: PanelShellProps) {
  const rootRef = usePanelDismiss(onClose)

  return (
    <div ref={rootRef} tabIndex={-1} className="flex h-full flex-col bg-white outline-none">
      <PanelHeader {...header} />
      {children}
    </div>
  )
}
