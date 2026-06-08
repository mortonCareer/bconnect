'use client'

import type { ReactNode } from 'react'
import { TopBar } from '@bconnect/ui'

/**
 * career 풀페이지 쉘 — 모든 career feature view(profile·messages 등)가 동일 TopBar 래핑을 재사용한다.
 * ADR-0020: 공용 View 의 renderShell 슬롯에 앱이 끼워 넣는 함수.
 */
export const careerShell = (onBack?: () => void) =>
  function CareerShell({ title, children }: { title: string; children: ReactNode }) {
    return (
      <div className="flex flex-col">
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
