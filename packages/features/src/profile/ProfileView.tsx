'use client'

import { parseAsStringEnum, useQueryState } from 'nuqs'
import {
  useGetCoworkers,
  useGetFeeds,
  useGetProfile,
  useGetReceivedRecommendations,
} from '@bconnect/api-client'
import { Skeleton, Tab } from '@bconnect/ui'
import { PanelShell } from '../_shared/PanelShell'
import { PanelScroll } from '../_shared/PanelScroll'
import { PanelMessage } from '../_shared/PanelMessage'
import { ProfileSummary } from './ProfileSummary'
import { IntroTab } from './IntroTab'
import { WorksTab } from './WorksTab'

type TabKey = 'intro' | 'works'

const TAB_ITEMS = [
  { key: 'intro', label: '소개' },
  { key: 'works', label: '작업물' },
]

export interface ProfileViewProps {
  profileId: number
  closeHref: string
  onClose: () => void
}

export function ProfileView({ profileId, closeHref, onClose }: ProfileViewProps) {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum<TabKey>(['intro', 'works']).withDefault('intro')
  )

  const enabled = Number.isFinite(profileId) && profileId > 0
  const { data, isLoading, isError } = useGetProfile(profileId, { query: { enabled } })
  const member = data?.member
  const profile = data?.profile

  const { data: coworkers } = useGetCoworkers({ profileId }, { query: { enabled } })
  const { data: received } = useGetReceivedRecommendations({ profileId }, { query: { enabled } })
  const { data: feeds } = useGetFeeds({ profileId }, { query: { enabled } })

  return (
    <PanelShell
      title={member?.username}
      closeLabel="프로필 패널 닫기"
      closeHref={closeHref}
      onClose={onClose}
    >
      <PanelScroll>
        {isLoading ? (
          <ProfileSkeleton />
        ) : isError || !profile ? (
          <PanelMessage>프로필을 불러올 수 없습니다</PanelMessage>
        ) : (
          <>
            <ProfileSummary
              member={member}
              profile={profile}
              postCount={feeds ? feeds.content.length : undefined}
              coworkerCount={coworkers?.length}
              recommendationCount={received?.length}
            />
            <Tab items={TAB_ITEMS} activeKey={tab} onChange={(key) => setTab(key as TabKey)} />
            {tab === 'intro' ? (
              <IntroTab profileId={profileId} profile={profile} />
            ) : (
              <WorksTab profileId={profileId} />
            )}
          </>
        )}
      </PanelScroll>
    </PanelShell>
  )
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-[100px] w-[100px] shrink-0 rounded-full" />
        <div className="flex flex-1 justify-around gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-12" />
          ))}
        </div>
      </div>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}
