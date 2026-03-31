'use client'

import { useRouter } from 'next/navigation'

interface StatsRowProps {
  postCount?: number
  coworkerCount?: number
  recommendationCount?: number
}

export function StatsRow({ postCount, coworkerCount, recommendationCount }: StatsRowProps) {
  const router = useRouter()

  return (
    <div className="flex justify-center gap-12 py-3">
      <StatItem label="작업물" value={postCount ?? 0} />
      <StatItem
        label="동료"
        value={coworkerCount ?? 0}
        onClick={() => router.push('/profile/coworkers')}
      />
      <StatItem
        label="추천서"
        value={recommendationCount ?? 0}
        onClick={() => router.push('/profile/recommendations')}
      />
    </div>
  )
}

function StatItem({
  label,
  value,
  onClick,
}: {
  label: string
  value: number
  onClick?: () => void
}) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper className="flex flex-col items-center gap-1" onClick={onClick}>
      <span className="text-sb-16">{value}</span>
      <span className="text-r-12 text-morton-gray-500">{label}</span>
    </Wrapper>
  )
}
