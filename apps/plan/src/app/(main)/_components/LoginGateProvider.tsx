'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { LoginPromptModal } from './LoginPromptModal'

interface LoginGateContextValue {
  /** 로그인이 필요한 액션의 진입점 — 로그인/회원가입 유도 모달을 띄운다. */
  requireLogin: () => void
}

const LoginGateContext = createContext<LoginGateContextValue | null>(null)

/**
 * 비회원 게이팅 모달을 트리 전체에서 단일 인스턴스로 관리한다.
 * 카드가 N개여도 모달은 하나만 렌더된다.
 */
export function LoginGateProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const requireLogin = useCallback(() => setOpen(true), [])
  const value = useMemo(() => ({ requireLogin }), [requireLogin])

  return (
    <LoginGateContext.Provider value={value}>
      {children}
      <LoginPromptModal open={open} onClose={() => setOpen(false)} />
    </LoginGateContext.Provider>
  )
}

export function useLoginGate() {
  const ctx = useContext(LoginGateContext)
  if (!ctx) {
    throw new Error('useLoginGate must be used within a LoginGateProvider')
  }
  return ctx
}
