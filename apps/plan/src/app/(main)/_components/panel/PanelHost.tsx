'use client'

import { useSearchParams } from 'next/navigation'
import { PanelCrawled } from './PanelCrawled'
import { PanelProfile } from './PanelProfile'
import { PanelCoworkers } from './PanelCoworkers'
import { PanelRecommendations } from './PanelRecommendations'
import { PanelMessages } from './PanelMessages'
import { PanelChat } from './PanelChat'
import { PanelNotifications } from './PanelNotifications'
import { PanelTask } from './PanelTask'

/**
 * 패널 호스트 (ADR-0021). `(main)` 셸에 상주하며 `?panel=` search param 을 읽어 dispatch.
 * 어떤 메인 콘텐츠(children) 위에도 떠 있고, 새로고침/뒤로/앞으로/공유가 URL 로 추적된다.
 *
 * `?panel=` 값 형태: `profile/5` · `profile/5/coworkers` · `profile/5/recommendations`
 *                   · `crawled/7` · `messages` · `messages/3` · `notifications` · `task/new` · `task/4`
 */
export function PanelHost() {
  const panel = useSearchParams().get('panel')
  if (!panel) return null

  const seg = panel.split('/')

  if (seg[0] === 'profile') {
    const profileId = Number(seg[1])
    if (!Number.isFinite(profileId) || profileId <= 0) return null
    if (seg[2] === 'coworkers') return <PanelCoworkers profileId={profileId} />
    if (seg[2] === 'recommendations') return <PanelRecommendations profileId={profileId} />
    return <PanelProfile profileId={profileId} />
  }

  if (seg[0] === 'crawled') {
    const crawledId = Number(seg[1])
    if (!Number.isFinite(crawledId) || crawledId <= 0) return null
    return <PanelCrawled crawledId={crawledId} />
  }

  if (seg[0] === 'messages') {
    if (seg[1] === undefined) return <PanelMessages />
    const chatId = Number(seg[1])
    if (!Number.isFinite(chatId) || chatId <= 0) return null
    return <PanelChat chatId={chatId} />
  }

  if (seg[0] === 'notifications') return <PanelNotifications />

  if (seg[0] === 'task') {
    if (seg[1] === 'new') return <PanelTask key="new" />
    if (seg[1]) return <PanelTask key={seg[1]} taskId={seg[1]} />
    return null
  }

  return null
}
