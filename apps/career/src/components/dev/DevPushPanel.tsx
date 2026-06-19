'use client'

import { Button, Input } from '@bconnect/ui'
import { useState } from 'react'

interface Preset {
  label: string
  title: string
  body: string
  url: string
  icon?: string
}

const PRESETS: Preset[] = [
  {
    label: '채팅',
    title: '김철수님',
    body: '안녕하세요, 견적 문의드립니다',
    url: '/messages/123',
    icon: 'https://i.pravatar.cc/192?img=12',
  },
  { label: '추천', title: '새 매칭 제안', body: '회원님께 맞는 공고가 있어요', url: '/feed/1' },
  { label: '시스템', title: '공지', body: '서비스 점검 안내드립니다', url: '/notifications' },
]

/** 개발 전용 — 현재 디바이스 토큰으로 FCM 푸시를 즉시 발송하는 트리거 패널. prod 빌드에선 마운트 안 됨. */
export function DevPushPanel({ token }: { token: string | null }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [custom, setCustom] = useState({
    title: '테스트 알림',
    body: '로컬 발송',
    url: '/messages/123',
  })

  async function send(payload: { title: string; body: string; url: string; icon?: string }) {
    if (!token) {
      setStatus('토큰 없음 — 알림 권한을 먼저 허용하세요')
      return
    }
    setStatus('발송 중…')
    try {
      const res = await fetch('/api/dev/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...payload }),
      })
      const json: { id?: string; error?: string } = await res.json()
      setStatus(
        res.ok ? `발송 성공: ${json.id?.split('/').pop()}` : `실패: ${json.error ?? res.status}`
      )
    } catch (error) {
      setStatus(`실패: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (!open) {
    return (
      <Button
        variant="secondary"
        size="small"
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-50 shadow-lg transition-colors"
      >
        🔔 dev push
      </Button>
    )
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
      <div className="flex items-center justify-between">
        <p className="text-sb-14 text-gray-900">dev push</p>
        <Button variant="text" size="small" onClick={() => setOpen(false)}>
          닫기
        </Button>
      </div>

      <p className="mt-1 text-r-12 text-gray-400 truncate">
        {token ? `토큰 …${token.slice(-12)}` : '토큰 없음 (권한 허용 필요)'}
      </p>

      <div className="mt-2 flex gap-1.5">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            variant="secondary"
            size="small"
            onClick={() => send(p)}
            className="flex-1"
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        <Input
          size="small"
          value={custom.title}
          onChange={(e) => setCustom({ ...custom, title: e.target.value })}
          placeholder="제목"
        />
        <Input
          size="small"
          value={custom.body}
          onChange={(e) => setCustom({ ...custom, body: e.target.value })}
          placeholder="본문"
        />
        <Input
          size="small"
          value={custom.url}
          onChange={(e) => setCustom({ ...custom, url: e.target.value })}
          placeholder="딥링크 (예: /messages/123)"
        />
        <Button variant="primary" size="small" onClick={() => send(custom)}>
          커스텀 발송
        </Button>
      </div>

      {status && <p className="mt-2 text-r-12 text-gray-500">{status}</p>}
    </div>
  )
}
