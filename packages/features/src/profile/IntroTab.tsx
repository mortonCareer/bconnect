'use client'

import { Fragment } from 'react'
import { useGetCredentials } from '@bconnect/api-client'
import type { Profile } from '@bconnect/api-client'
import { Skeleton, Tag } from '@bconnect/ui'
import { getCredentialLabel } from './labels'
import { RecommendationList } from './RecommendationList'

interface IntroTabProps {
  profileId: number
  profile?: Profile
}

export function IntroTab({ profileId, profile }: IntroTabProps) {
  const enabled = Number.isFinite(profileId) && profileId > 0
  const { data: credentials, isLoading: credentialsLoading } = useGetCredentials(
    { profileId },
    { query: { enabled } }
  )
  const accepted = (credentials ?? []).filter((c) => c.status === 'ACCEPTED')

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <section className="flex flex-col gap-3">
        <h3 className="text-sb-16 text-gray-900">인증</h3>
        {credentialsLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[34px] w-20 rounded-[7px]" />
            ))}
          </div>
        ) : accepted.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {accepted.map((c) => (
              <Tag key={c.id} size="sm">
                {getCredentialLabel(c.type)}
              </Tag>
            ))}
          </div>
        ) : (
          <p className="text-r-14 text-gray-500">등록된 인증이 없습니다</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sb-16 text-gray-900">소개</h3>
        {profile?.about ? (
          <p className="whitespace-pre-wrap text-r-14 leading-[22.4px] text-gray-900">
            {renderWithHashtags(profile.about)}
          </p>
        ) : (
          <p className="text-r-14 text-gray-500">등록된 소개가 없습니다</p>
        )}
      </section>

      <RecommendationList profileId={profileId} />
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
