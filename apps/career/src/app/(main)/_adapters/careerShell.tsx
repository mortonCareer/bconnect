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
 *
 * `utility`: 최상위 라우트(하단 네비 — 예: 내 정보) 우측 알림·채팅 아이콘. 홈 피드와 동등.
 */
interface CareerShellOpts {
  fill?: boolean
  utility?: { chatHref?: string; chatCount?: number; notifyHref?: string; notifyCount?: number }
  /** 좌측 back 자리 커스텀 아이콘 라우트 (예: 프로필 '+' 작업물 생성, #966) */
  left?: { icon: ReactNode; href: string; label: string }
  /** 우측 아이콘 라우트 (예: 프로필 설정) — TopBar action 계열로 전달. utility 와 동시 지정 시 utility 우선 */
  right?: { icon: ReactNode; href: string; label: string }
}

export const careerShell = (onBack?: () => void, opts?: CareerShellOpts) =>
  function CareerShell({ title, children }: { title: string; children: ReactNode }) {
    return (
      <div className={opts?.fill ? 'flex min-h-0 flex-1 flex-col' : 'flex flex-col'}>
        <TopBar
          variant="default"
          title={title}
          showAction={false}
          actionIcon={opts?.right?.icon}
          actionHref={opts?.right?.href}
          actionLabel={opts?.right?.label}
          showBack={onBack != null}
          onBack={onBack}
          leftIcon={opts?.left?.icon}
          leftHref={opts?.left?.href}
          leftLabel={opts?.left?.label}
          chatHref={opts?.utility?.chatHref}
          chatCount={opts?.utility?.chatCount}
          notifyHref={opts?.utility?.notifyHref}
          notifyCount={opts?.utility?.notifyCount}
        />
        {children}
      </div>
    )
  }
