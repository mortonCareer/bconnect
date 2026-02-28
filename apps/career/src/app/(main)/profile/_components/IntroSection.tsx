'use client'

import type { Profile } from '@morton/api-client'

interface IntroSectionProps {
  profile: Profile
}

export function IntroSection({ profile }: IntroSectionProps) {
  const { about } = profile

  if (!about) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-m-14 text-morton-gray-500">등록된 소개가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-6">
      <p className="text-sb-16 text-morton-gray-900">소개</p>
      <p className="whitespace-pre-wrap text-r-12 text-morton-gray-900">{about}</p>
    </div>
  )
}
