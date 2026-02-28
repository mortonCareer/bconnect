'use client'

import type { Profile } from '@morton/api-client'
import { Tag } from '@morton/ui'
import { TRADE_LABELS } from '@/lib/trade-labels'

interface IntroSectionProps {
  profile: Profile
}

export function IntroSection({ profile }: IntroSectionProps) {
  const { headline, about, trades, experience, address } = profile

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* 한 줄 소개 */}
      {headline && (
        <div className="flex flex-col gap-2">
          <p className="text-sb-16 text-morton-gray-900">한 줄 소개</p>
          <p className="text-m-14 text-morton-gray-700">{headline}</p>
        </div>
      )}

      {/* 소개 */}
      {about && (
        <div className="flex flex-col gap-2">
          <p className="text-sb-16 text-morton-gray-900">소개</p>
          <p className="whitespace-pre-wrap text-m-14 text-morton-gray-700">{about}</p>
        </div>
      )}

      {/* 시공분야 */}
      {trades && trades.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sb-16 text-morton-gray-900">시공분야</p>
          <div className="flex flex-wrap gap-2">
            {trades.map((trade) => (
              <Tag key={trade} variant="selected" size="sm">
                {TRADE_LABELS[trade] ?? trade}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {/* 경력 */}
      {experience !== undefined && experience !== null && (
        <div className="flex flex-col gap-2">
          <p className="text-sb-16 text-morton-gray-900">경력</p>
          <p className="text-m-14 text-morton-gray-700">{experience}년</p>
        </div>
      )}

      {/* 지역 */}
      {address?.city && (
        <div className="flex flex-col gap-2">
          <p className="text-sb-16 text-morton-gray-900">지역</p>
          <p className="text-m-14 text-morton-gray-700">{address.city}</p>
        </div>
      )}

      {/* 정보 없음 */}
      {!headline &&
        !about &&
        (!trades || trades.length === 0) &&
        experience === undefined &&
        !address?.city && (
          <div className="flex items-center justify-center py-10">
            <p className="text-m-14 text-morton-gray-500">등록된 소개가 없습니다</p>
          </div>
        )}
    </div>
  )
}
