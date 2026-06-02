'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Button } from '@bconnect/ui'

interface LoginPromptModalProps {
  open: boolean
  onClose: () => void
}

/**
 * 비회원이 게이팅된 액션(프로필 보기·메시지 보내기)을 누를 때 뜨는 로그인/회원가입 유도 모달.
 * (main)/layout.tsx 가 overflow-hidden 이라 createPortal 로 body 에 렌더해 잘림을 피한다.
 */
export function LoginPromptModal({ open, onClose }: LoginPromptModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // ESC 닫기 + 열림 동안 body 스크롤 잠금 + 모달로 포커스 이동
  useEffect(() => {
    if (!open) return

    panelRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        tabIndex={-1}
        className="relative flex w-full max-w-100 flex-col gap-6 rounded-[13px] bg-white p-7 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-[18px] top-[18px] flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          {/* TODO: #384 — packages/ui/src/icons 공통 아이콘으로 추출 (인라인 svg 금지) */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 4L4 12M4 4l8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* 안내 카피 — 가입 유도 */}
        <div className="flex flex-col gap-2 pr-6">
          <p id="login-prompt-title" className="text-sb-20 text-gray-900">
            로그인하고 기술자와 바로 연결하세요
          </p>
          <p className="break-keep text-r-16 text-gray-700">
            검증된 기술자의 프로필과 작업물을 확인하고, 메시지로 바로 문의할 수 있어요.
          </p>
        </div>

        {/* CTA — GuestSidebar 와 동선 통일 */}
        <div className="flex flex-col gap-2">
          <Button asChild variant="primary" size="full" className="h-10">
            <Link href="/login">로그인</Link>
          </Button>
          <Button asChild variant="outline" size="full" className="h-10">
            <Link href="/signup/member">회원가입</Link>
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
