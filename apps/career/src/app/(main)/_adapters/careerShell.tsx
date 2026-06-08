'use client'

import type { ReactNode } from 'react'
import { TopBar } from '@bconnect/ui'

/**
 * career 풀페이지 쉘 — 모든 career feature view(profile·messages 등)가 동일 TopBar 래핑을 재사용한다.
 * ADR-0020: 공용 View 의 renderShell 슬롯에 앱이 끼워 넣는 함수.
 *
 * `fill`: 채팅방처럼 본문이 뷰포트를 꽉 채우고 하단(입력창)을 바닥에 고정해야 하는 화면용.
 * MainContent 가 chat 상세 라우트에서 `h-dvh flex-col` 을 주므로 `flex-1 min-h-0` 로 그 높이를 채운다.
 * 목록·프로필 등 문서 스크롤 화면은 기본값(content-height).
 */
export const careerShell = (onBack?: () => void, opts?: { fill?: boolean }) =>
  function CareerShell({ title, children }: { title: string; children: ReactNode }) {
    return (
      <div className={opts?.fill ? 'flex min-h-0 flex-1 flex-col' : 'flex flex-col'}>
        <TopBar
          variant="default"
          title={title}
          showAction={false}
          showBack={onBack != null}
          onBack={onBack}
        />
        {children}
      </div>
    )
  }
