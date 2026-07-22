'use client'

import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'

// Agentation 비주얼 피드백 툴바 게이트 (이슈 #135).
// 로컬 dev (NODE_ENV=development) 에서만 agentation 툴바를 동적 로드해 마운트한다.
// 요소를 클릭/주석하면 셀렉터·소스 컨텍스트가 담긴 구조화 마크다운이 만들어져
// AI 코딩 에이전트에 정확한 수정 지점을 전달한다.
// endpoint(:4747)는 로컬 agentation-mcp 서버(Agent Sync) 주소 — 서버가 떠 있으면
// 주석이 Claude Code 로 실시간 전송되고, 없으면 복사-붙여넣기 모드로 폴백한다.
// production/preview 빌드에선 동적 import 가 tree-shake 되어 번들에 포함되지 않는다.
const AGENT_SYNC_ENDPOINT = 'http://localhost:4747'

export function DevToolbar() {
  const enabled = process.env.NODE_ENV === 'development'
  const [Toolbar, setToolbar] = useState<ComponentType<{ endpoint?: string }> | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    import('agentation')
      .then((mod) => {
        if (!cancelled) setToolbar(() => mod.Agentation)
      })
      .catch((e) => {
        console.error('[Agentation] 로드 실패', e)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  if (!Toolbar) return null
  return <Toolbar endpoint={AGENT_SYNC_ENDPOINT} />
}
