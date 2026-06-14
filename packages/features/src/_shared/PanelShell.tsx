'use client'

import { useEffect, useRef } from 'react'
import { PanelHeader, type PanelHeaderProps } from './PanelHeader'

interface PanelShellProps extends PanelHeaderProps {
  onClose: () => void
  children: React.ReactNode
}

/**
 * `@panel` 뷰 공통 레이아웃 — root(마운트 포커스 + Esc 닫기 포함) + PanelHeader + children.
 * 본문 구조/상태(loading·error·empty)는 강제하지 않고 children 으로 위임한다.
 * 리스트형 뷰는 children 을 `PanelScroll` 로 감싸고, ChatView 처럼 자체 레이아웃이면 자유 조합.
 */
export function PanelShell({ onClose, children, ...header }: PanelShellProps) {
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
    <div ref={rootRef} tabIndex={-1} className="flex h-full flex-col bg-white outline-none">
      <PanelHeader {...header} />
      {children}
    </div>
  )
}
