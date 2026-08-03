'use client'

import { Button, Input } from '@bconnect/ui'
import { useState } from 'react'
import { usePushStore } from '@bconnect/push'
import { NotificationReferenceType } from '@bconnect/api-client'

interface PushRequest {
  title: string
  body: string
  referenceType: string
  referenceId: string
}

/** referenceType 은 BE enum 으로 좁혀 오타를 컴파일 타임에 잡는다. */
type Preset = PushRequest & { label: string; referenceType: NotificationReferenceType | '' }

const PRESETS: Preset[] = [
  {
    label: '채팅',
    title: '김철수님',
    body: '안녕하세요, 견적 문의드립니다',
    referenceType: NotificationReferenceType.CHAT_ROOM,
    referenceId: '123',
  },
  {
    label: '프로필',
    title: '프로필 완성',
    body: '프로필을 완성하고 업체로부터 일감을 받아보세요',
    referenceType: NotificationReferenceType.PROFILE,
    referenceId: '',
  },
  {
    label: '목적지없음',
    title: '공지',
    body: '서비스 점검 안내드립니다',
    referenceType: '',
    referenceId: '',
  },
]

/** 개발 전용 — 현재 디바이스 토큰으로 FCM 푸시를 즉시 발송하는 트리거 패널. prod 빌드에선 마운트 안 됨. */
export function DevPushPanel() {
  const token = usePushStore((s) => s.token)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [custom, setCustom] = useState({
    title: '테스트 알림',
    body: '로컬 발송',
    referenceType: 'CHAT_ROOM',
    referenceId: '123',
  })

  async function send(payload: PushRequest) {
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
          value={custom.referenceType}
          onChange={(e) => setCustom({ ...custom, referenceType: e.target.value })}
          placeholder="referenceType (예: CHAT_ROOM)"
        />
        <Input
          size="small"
          value={custom.referenceId}
          onChange={(e) => setCustom({ ...custom, referenceId: e.target.value })}
          placeholder="referenceId (예: 123)"
        />
        <Button variant="primary" size="small" onClick={() => send(custom)}>
          커스텀 발송
        </Button>
      </div>

      {status && <p className="mt-2 text-r-12 text-gray-500">{status}</p>}
    </div>
  )
}
