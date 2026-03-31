'use client'

import { useRouter } from 'next/navigation'
import type { Credential, Profile } from '@morton/api-client'
import { Tag } from '@morton/ui'
import { getCredentialLabel } from '../certifications/constants'

interface IntroSectionProps {
  profile: Profile
  credentials?: Credential[]
}

export function IntroSection({ profile, credentials }: IntroSectionProps) {
  const router = useRouter()
  const { about } = profile

  const acceptedCredentials = credentials?.filter((c) => c.status === 'ACCEPTED') ?? []

  return (
    <div className="flex flex-col">
      {/* 인증 섹션 */}
      <div className="flex flex-col gap-2 px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sb-16 text-morton-gray-900">인증</span>
          <button
            className="text-r-12 text-morton-primary"
            onClick={() => router.push('/profile/certifications')}
          >
            편집
          </button>
        </div>
        {acceptedCredentials.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {acceptedCredentials.map((c) => (
              <Tag key={c.id} variant="default" size="sm">
                {c.type ? getCredentialLabel(c.type) : '알 수 없음'}
              </Tag>
            ))}
          </div>
        ) : (
          <p className="text-r-12 text-morton-gray-500">등록된 인증이 없습니다</p>
        )}
      </div>

      <div className="mx-4 border-t border-morton-gray-200" />

      {/* 소개 섹션 */}
      <div className="flex flex-col gap-2 px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sb-16 text-morton-gray-900">소개</span>
          <button
            className="text-r-12 text-morton-primary"
            onClick={() => router.push('/profile/edit')}
          >
            편집
          </button>
        </div>
        {about ? (
          <p className="whitespace-pre-wrap text-r-12 text-morton-gray-900">{about}</p>
        ) : (
          <p className="text-r-12 text-morton-gray-500">등록된 소개가 없습니다</p>
        )}
      </div>
    </div>
  )
}
