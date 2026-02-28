'use client'

import { useState } from 'react'

interface ChatInputProps {
  onSend: (content: string) => void
}

export default function ChatInput({ onSend }: ChatInputProps) {
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

  return (
    <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-morton-gray-200 bg-white">
      <div className="mx-auto flex max-w-screen-sm items-center gap-2 px-4 py-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요"
          className="text-m-14 flex-1 rounded-full border border-morton-gray-200 bg-morton-gray-100 px-4 py-2.5 text-morton-gray-900 placeholder:text-morton-gray-400 focus:border-morton-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-morton-primary text-white transition-all active:scale-95 disabled:bg-morton-gray-200 disabled:text-morton-gray-400"
          aria-label="보내기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M18.3333 1.66666L9.16667 10.8333M18.3333 1.66666L12.5 18.3333L9.16667 10.8333M18.3333 1.66666L1.66667 7.5L9.16667 10.8333"
              stroke="currentColor"
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
