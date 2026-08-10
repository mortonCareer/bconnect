'use client'

import { useEffect } from 'react'
import { SERVICE_NAME } from '@bconnect/config/site'

/**
 * 루트 layout 의 title.template(`%s | 품앗이`)은 서버 렌더 시점에만 적용된다.
 * 인증이 필요한 데이터(프로젝트명, 안읽은 알림 수 등)로 로딩 후 title 을 갱신해야 할 때
 * 클라이언트에서 이 훅으로 동일한 포맷의 document.title 을 직접 반영한다.
 * title 이 아직 없으면(데이터 로딩 전) 아무 것도 하지 않아 SSR 시 설정된 fallback 타이틀을 유지한다.
 */
export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    if (!title) return

    const prev = document.title
    document.title = `${title} | ${SERVICE_NAME}`

    return () => {
      document.title = prev
    }
  }, [title])
}
