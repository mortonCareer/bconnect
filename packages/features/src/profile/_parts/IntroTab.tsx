'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { getCredentialLabel } from '@bconnect/api-client'
import type { Credential, Profile, Recommendation } from '@bconnect/api-client'
import { Skeleton } from '@bconnect/ui'
import { RecommendationList } from '../RecommendationList'

/** owner 전용 편집 링크. 없으면 편집 어포던스 안 그림 (viewer/plan). */
export interface ProfileEditHrefs {
  certifications?: string
  about?: string
  recommendations?: string
}

interface IntroTabProps {
  profile?: Profile
  /** 앱이 resolve 해 내려줌. undefined = 로딩 중 */
  credentials?: Credential[]
  receivedRecommendations?: Recommendation[]
  sentRecommendations?: Recommendation[]
  editHrefs?: ProfileEditHrefs
  /** owner 전용 추천서 액션. 없으면 카드 케밥 안 그림 (viewer/plan) */
  onHideRecommendation?: (id: number) => void
  onDeleteRecommendation?: (id: number) => void
}

export function IntroTab({
  profile,
  credentials,
  receivedRecommendations,
  sentRecommendations,
  editHrefs,
  onHideRecommendation,
  onDeleteRecommendation,
}: IntroTabProps) {
  const credentialsLoading = credentials === undefined
  const accepted = (credentials ?? []).filter((c) => c.status === 'ACCEPTED')

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <section className="flex flex-col gap-3">
        <SectionHeader title="인증" editHref={editHrefs?.certifications} />
        {credentialsLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[35px] w-20 rounded" />
            ))}
          </div>
        ) : accepted.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {accepted.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center rounded border border-[#E5E5E5] bg-white px-3 py-1.5 text-r-14 text-[#7B7B7B]"
              >
                {getCredentialLabel(c.type)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-r-14 text-gray-500">등록된 인증이 없습니다</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="소개" editHref={editHrefs?.about} />
        {profile?.about ? (
          <p className="whitespace-pre-wrap text-r-14 leading-[22.4px] text-gray-900">
            {renderWithHashtags(profile.about)}
          </p>
        ) : (
          <p className="text-r-14 text-gray-500">등록된 소개가 없습니다</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="추천서" editHref={editHrefs?.recommendations} />
        <RecommendationList
          received={receivedRecommendations}
          sent={sentRecommendations}
          variant="inline"
          onHide={onHideRecommendation}
          onDelete={onDeleteRecommendation}
        />
      </section>
    </div>
  )
}

function SectionHeader({ title, editHref }: { title: string; editHref?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sb-16 text-gray-900">{title}</h3>
      {editHref && (
        <Link href={editHref} className="cursor-pointer text-r-12 text-primary underline">
          편집
        </Link>
      )}
    </div>
  )
}

function renderWithHashtags(text: string) {
  return text.split(/(#\S+)/g).map((part, i) =>
    part.startsWith('#') ? (
      <span key={i} className="text-primary">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}
