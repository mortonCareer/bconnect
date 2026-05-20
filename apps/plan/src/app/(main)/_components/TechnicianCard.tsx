'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button, cn } from '@bconnect/ui'
import { TRADE_LABELS } from '@/lib/trade-labels'
import type { TechnicianItem } from '@/hooks/useTechnicianItems'
import type { Trade } from '@bconnect/api-client'

// Figma node 1504:12113 — bg-gray-100, border-gray-300, rounded-7, R14 gray-700
function CertTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-[7px] border border-bconnect-gray-300 bg-bconnect-gray-100 px-[8px] py-[4px] text-r-14 text-bconnect-gray-700">
      {label}
    </span>
  )
}

// Figma node 1504:12099/12102 — rounded-full pill, selected=primary fill, default=white+gray border
// M12 타이포는 직접 값으로 우회 — cn()의 tailwind-merge가 커스텀 text-m-12를 text-{color}와
// 같은 충돌 그룹으로 오판해 제거하기 때문.
// TODO: #381 — utils.ts cn() 에 extendTailwindMerge 적용되면 text-m-12 로 되돌리기.
function SkillTag({ label, selected }: { label: string; selected: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-[12px] py-[4px] font-[Pretendard_Variable] text-[12px] font-medium leading-[1.6]',
        selected
          ? 'border-bconnect-primary bg-bconnect-primary-sub text-bconnect-primary'
          : 'border-bconnect-gray-300 bg-white text-bconnect-gray-700'
      )}
    >
      {label}
    </span>
  )
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-[2px]">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full || (i === full && half)
          return (
            <svg key={i} width="14" height="14" viewBox="0 0 16 16" fill="none">
              {/* 비활성: bconnect-gray-300 (#E5E5E5). 활성: 별점 전용 amber — 디자인 시스템 미정 (TODO: 토큰 추가 시 교체) */}
              <path
                d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.13L8 10.4l-3.71 2.15L5 8.42 2 5.5l4.15-.75L8 1z"
                fill={filled ? '#FFB800' : 'var(--bconnect-gray-300)'}
              />
            </svg>
          )
        })}
      </div>
      <span className="text-m-14 text-bconnect-gray-900">{rating.toFixed(1)}</span>
      <span className="text-r-14 text-bconnect-gray-500">({reviewCount})</span>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sb-24 text-bconnect-gray-900">{value}</span>
      <span className="text-r-14 text-bconnect-gray-500">{label}</span>
    </div>
  )
}

// 3개 기준 폭 고정 (135 ≈ (422 - 2*9) / 3). 1-2개여도 동일 크기 유지.
function PortfolioThumb({ imageUrl, daysRequired }: { imageUrl?: string; daysRequired?: number }) {
  return (
    <div className="flex w-[135px] shrink-0 flex-col items-end gap-[6px]">
      <div className="relative aspect-square w-full overflow-hidden rounded-[9px] bg-bconnect-gray-100">
        {imageUrl && <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />}
      </div>
      <span className="text-r-14 text-bconnect-gray-500">
        {daysRequired ? `${daysRequired}일 소요` : ' '}
      </span>
    </div>
  )
}

interface TechnicianCardProps {
  item: TechnicianItem
}

export function TechnicianCard({ item }: TechnicianCardProps) {
  const router = useRouter()

  const handleGatedAction = () => {
    router.push('/login')
  }

  const metaParts = [
    item.location,
    item.primaryTrade,
    item.experienceYears > 0 ? `${item.experienceYears}년` : '신입',
  ].filter(Boolean)

  // TODO: BE #211 — 실 portfolio 데이터 연동 전까진 3개 placeholder
  const portfolios =
    item.portfolios.length > 0
      ? item.portfolios.slice(0, 3)
      : Array.from({ length: 3 }, () => ({ imageUrl: '', daysRequired: 0 }))

  return (
    <div className="flex gap-[27px] rounded-[13px] border border-bconnect-gray-300 bg-white p-[28px]">
      {/* 좌측: 프로필 + 정보 + 태그 + 버튼 */}
      <div className="flex flex-1 gap-[18px]">
        <div className="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-full bg-bconnect-gray-100">
          <Image src={item.picture} alt={item.name} fill className="object-cover" unoptimized />
        </div>

        <div className="flex flex-1 flex-col gap-4">
          {/* 이름 + 메타 + 별점/계약·게시글 */}
          <div className="flex flex-col gap-[6px]">
            <div className="flex items-baseline gap-[10px]">
              <p className="text-sb-20 text-bconnect-gray-900">{item.name}</p>
              <p className="text-r-14 text-bconnect-gray-500">{metaParts.join(' · ')}</p>
            </div>
            <div className="flex items-center gap-[11px]">
              {/* TODO: BE #211 구현 후 실데이터 교체 */}
              <StarRating rating={item.rating} reviewCount={item.reviewCount} />
              {/* Figma node 1470:6775 — 행 높이(20px) 세로 divider, gray-100 */}
              <span className="h-5 w-px bg-bconnect-gray-100" />
              <span className="text-r-14 text-bconnect-gray-500">
                계약 {item.contractCount} · 게시글 {item.postCount}
              </span>
            </div>
          </div>

          {/* 한 줄 소개 */}
          {item.headline && (
            <p className="line-clamp-2 text-r-16 text-bconnect-gray-900">{item.headline}</p>
          )}

          {/* 공종 + 인증 태그 — Figma 1470:6779 그룹 (내부 gap 7.85 ≈ gap-2) */}
          {(item.trades.length > 0 || item.certifications.length > 0) && (
            <div className="flex flex-col gap-2">
              {/* 공종 태그 (첫번째 = selected) */}
              {item.trades.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.trades.map((trade: Trade, idx) => (
                    <SkillTag
                      key={trade}
                      label={TRADE_LABELS[trade] ?? trade}
                      selected={idx === 0}
                    />
                  ))}
                </div>
              )}

              {/* 인증 태그 */}
              {/* TODO: BE #211 구현 후 실데이터 교체 */}
              {item.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.certifications.map((cert) => (
                    <CertTag key={cert} label={cert} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 액션 버튼 — Figma 카드: h-40 w-full. design system Button 의 'full' size 는 h-50 이라 h-40 override. */}
          <div className="mt-auto flex gap-[10px]">
            <Button variant="outline" size="full" className="h-[40px]" onClick={handleGatedAction}>
              프로필 보기
            </Button>
            <Button variant="primary" size="full" className="h-[40px]" onClick={handleGatedAction}>
              메시지 보내기
            </Button>
          </div>
        </div>
      </div>

      {/* 세로 divider */}
      <div className="w-px shrink-0 self-stretch bg-bconnect-gray-100" />

      {/* 우측: 통계 + 작업물 썸네일 */}
      <div className="flex w-[422px] shrink-0 flex-col gap-[22px]">
        {/* 통계 3개 */}
        {/* TODO: BE #211 구현 후 실데이터 교체 */}
        <div className="flex gap-[32px]">
          <Stat value={item.postCount} label="작업물" />
          <Stat value={item.coworkerCount} label="동료" />
          <Stat value={item.recommendCount} label="추천서" />
        </div>

        {/* 작업물 썸네일 3개 */}
        {/* TODO: BE #211 구현 후 실데이터 교체 */}
        <div className="flex flex-1 gap-[9px]">
          {portfolios.map((p, i) => (
            <PortfolioThumb
              key={i}
              imageUrl={p.imageUrl || undefined}
              daysRequired={p.daysRequired || undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
