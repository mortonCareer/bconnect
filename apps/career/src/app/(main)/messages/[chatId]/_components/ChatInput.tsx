'use client'

import { useState } from 'react'

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('')

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const isDisabled = !text.trim() || !!disabled

  return (
    <div className="shrink-0 bg-white">
      <div className="flex h-20 items-center gap-2 px-6 py-4">
        {/* 이미지 첨부 아이콘 */}
        <button type="button" className="shrink-0" aria-label="이미지 첨부">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="#A5A5A5" strokeWidth="1.5" />
            <circle cx="8.5" cy="8.5" r="1.5" stroke="#A5A5A5" strokeWidth="1.5" />
            <path
              d="M3 16L8.29 11.47C8.68 11.12 9.27 11.13 9.65 11.49L14 15.5"
              stroke="#A5A5A5"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13 14.5L15.29 12.47C15.68 12.12 16.27 12.13 16.65 12.49L21 16"
              stroke="#A5A5A5"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* 텍스트 입력 */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="내용을 입력해주세요."
          className="text-r-14 min-w-0 flex-1 rounded-xl bg-morton-gray-100 px-4 py-[9px] text-morton-gray-900 placeholder:text-morton-gray-500 focus:outline-none"
        />

        {/* 전송 버튼 */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isDisabled}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-morton-primary transition-colors active:scale-95 disabled:bg-morton-gray-500"
          aria-label="보내기"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
