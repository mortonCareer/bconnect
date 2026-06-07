'use client'

import type { ReactNode } from 'react'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import type { Credential, MaskedMember, Profile, Recommendation } from '@bconnect/api-client'
import { Skeleton, Tab } from '@bconnect/ui'
import { PanelShell } from '../_shared/PanelShell'
import { PanelScroll } from '../_shared/PanelScroll'
import { PanelMessage } from '../_shared/PanelMessage'
import { ProfileSummary, type ProfileStatHrefs } from './ProfileSummary'
import { IntroTab, type ProfileEditHrefs } from './IntroTab'
import { WorksTab } from './WorksTab'

type TabKey = 'intro' | 'works'

const TAB_ITEMS = [
  { key: 'intro', label: '소개' },
  { key: 'works', label: '작업물' },
]

/** 앱이 resolve 해 내려주는 데이터. owner 어댑터는 useGetMy*, viewer/plan 은 by-id 훅으로 채운다. */
export interface ProfileViewData {
  member?: MaskedMember
  profile?: Profile
  postCount?: number
  coworkerCount?: number
  recommendationCount?: number
  credentials?: Credential[]
  receivedRecommendations?: Recommendation[]
  sentRecommendations?: Recommendation[]
  isLoading: boolean
  isError: boolean
}

interface ProfileViewBaseProps {
  /** WorksTab 의 by-id feed self-fetch 용 (마스킹 무관 — 발산 없음) */
  profileId: number
  data: ProfileViewData
  /** summary 와 Tab 사이에 꽂히는 액션 버튼 행 (owner: 수정/공유, viewer: 동료/메시지). 없으면 액션 행 없음 (plan) */
  actionSlot?: ReactNode
  editHrefs?: ProfileEditHrefs
  statHrefs?: ProfileStatHrefs
  /** owner 전용 작업물 수정 href 빌더. 없으면 케밥 메뉴 없음 (viewer/plan) */
  workEditHref?: (postId: number) => string
}

type ProfileViewShellProps =
  | {
      /** 풀페이지 등 비-패널 쉘 주입 (career 풀페이지 라우트). title 은 비동기 도출분을 전달받음 */
      renderShell: (props: { title: string; children: ReactNode }) => ReactNode
      closeHref?: never
      onClose?: never
    }
  | {
      /** 기본 @panel 쉘 (plan) */
      renderShell?: never
      closeHref: string
      onClose: () => void
    }

export type ProfileViewProps = ProfileViewBaseProps & ProfileViewShellProps

export function ProfileView(props: ProfileViewProps) {
  const { profileId, data, actionSlot, editHrefs, statHrefs, workEditHref } = props
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum<TabKey>(['intro', 'works']).withDefault('intro')
  )

  const { member, profile } = data
  const title = member?.username ?? member?.name ?? '프로필'

  const body = (
    <PanelScroll>
      {data.isLoading ? (
        <ProfileSkeleton />
      ) : data.isError || !profile ? (
        <PanelMessage>프로필을 불러올 수 없습니다</PanelMessage>
      ) : (
        <>
          <ProfileSummary
            member={member}
            profile={profile}
            postCount={data.postCount}
            coworkerCount={data.coworkerCount}
            recommendationCount={data.recommendationCount}
            statHrefs={statHrefs}
          />
          {actionSlot}
          <Tab items={TAB_ITEMS} activeKey={tab} onChange={(key) => setTab(key as TabKey)} />
          {tab === 'intro' ? (
            <IntroTab
              profile={profile}
              credentials={data.credentials}
              receivedRecommendations={data.receivedRecommendations}
              sentRecommendations={data.sentRecommendations}
              editHrefs={editHrefs}
            />
          ) : (
            <WorksTab profileId={profileId} workEditHref={workEditHref} />
          )}
        </>
      )}
    </PanelScroll>
  )

  if (props.renderShell) {
    return <>{props.renderShell({ title, children: body })}</>
  }

  return (
    <PanelShell
      title={member?.username}
      closeLabel="프로필 패널 닫기"
      closeHref={props.closeHref}
      onClose={props.onClose}
    >
      {body}
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
