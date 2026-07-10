'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button, CertTag, SkillTag, StarIcon, toast, isApiErrorShape } from '@bconnect/ui'
import { TRADE_LABELS, useCreateDirectChat } from '@bconnect/api-client'
import { usePanelNav } from '@/hooks/usePanelNav'
import { useAuthStore } from '@/stores/auth-store'
import type { TechnicianItem } from '@/hooks/useTechnicianItems'
import type { Trade } from '@bconnect/api-client'
import { useLoginGate } from './LoginGateProvider'

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full || (i === full && half)
          return <StarIcon key={i} size={14} filled={filled} />
        })}
      </div>
      <span className="text-m-14 text-gray-900">{rating.toFixed(1)}</span>
      <span className="text-r-14 text-gray-500">({reviewCount})</span>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sb-24 text-gray-900">{value}</span>
      <span className="text-r-14 text-gray-500">{label}</span>
    </div>
  )
}

// 3개 기준 폭 고정 (135 ≈ (422 - 2*9) / 3). 1-2개여도 동일 크기 유지.
function PortfolioThumb({ imageUrl, daysRequired }: { imageUrl?: string; daysRequired?: number }) {
  return (
    <div className="flex w-[135px] shrink-0 flex-col items-end gap-1.5">
      <div className="relative aspect-square w-full overflow-hidden rounded-[9px] bg-gray-100">
        {imageUrl && <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />}
      </div>
      <span className="text-r-14 text-gray-500">
        {daysRequired ? `${daysRequired}일 소요` : ' '}
      </span>
    </div>
  )
}

interface TechnicianCardProps {
  item: TechnicianItem
}

export function TechnicianCard({ item }: TechnicianCardProps) {
  const { requireLogin } = useLoginGate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { panelHref, openPanel } = usePanelNav()
  const profileHref = panelHref(`profile/${item.profileId}`)
  const { mutate: createDirectChat, isPending: isCreatingChat } = useCreateDirectChat()

  const metaParts = [
    item.location,
    item.grade,
    item.experienceYears > 0 ? `${item.experienceYears}년` : '신입',
  ].filter(Boolean)

  // TODO: 포트폴리오 BE 도메인 미구현 — 연동 전까진 3개 placeholder
  const portfolios =
    item.portfolios.length > 0
      ? item.portfolios.slice(0, 3)
      : Array.from({ length: 3 }, () => ({ imageUrl: '', daysRequired: 0 }))

  return (
    <div className="flex gap-[27px] rounded-[13px] border border-gray-300 bg-white p-7">
      {/* 좌측: 프로필 + 정보 + 태그 + 버튼 */}
      <div className="flex flex-1 gap-[18px]">
        <div className="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-full bg-gray-100">
          <Image src={item.picture} alt={item.name} fill className="object-cover" unoptimized />
        </div>

        <div className="flex flex-1 flex-col gap-4">
          {/* 이름 + 메타 + 별점/계약·게시글 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2.5">
              <p className="text-sb-20 text-gray-900">{item.name}</p>
              <p className="text-r-14 text-gray-500">{metaParts.join(' · ')}</p>
            </div>
            <div className="flex items-center gap-[11px]">
              {/* TODO: 리뷰(별점)·계약수 BE 도메인 미구현 — 중립값 표시 */}
              <StarRating rating={item.rating} reviewCount={item.reviewCount} />
              {/* Figma node 1470:6775 — 행 높이(20px) 세로 divider, gray-100 */}
              <span className="h-5 w-px bg-gray-100" />
              <span className="text-r-14 text-gray-500">
                계약 {item.contractCount} · 게시글 {item.postCount}
              </span>
            </div>
          </div>

          {/* 한 줄 소개 */}
          {item.headline && <p className="line-clamp-2 text-r-16 text-gray-900">{item.headline}</p>}

          {/* 공종 + 인증 태그 — Figma 1470:6779 그룹 (내부 gap 7.85 ≈ gap-2) */}
          {(item.trades.length > 0 || item.certifications.length > 0) && (
            <div className="flex flex-col gap-2">
              {/* 공종 태그 (primaryTrade = selected, 파란색) */}
              {item.trades.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.trades.map((trade: Trade) => (
                    <SkillTag
                      key={trade}
                      label={TRADE_LABELS[trade] ?? trade}
                      selected={trade === item.primaryTrade}
                    />
                  ))}
                </div>
              )}

              {/* 인증 태그 */}
              {/* TODO: 타인 프로필 credentials 조회 API 미구현 — 연동 전까진 빈 목록 */}
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
          <div className="mt-auto flex gap-2.5">
            {isAuthenticated ? (
              <Button asChild variant="outline" size="full" className="h-10">
                <Link href={profileHref} scroll={false}>
                  프로필 보기
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="full" className="h-10" onClick={requireLogin}>
                프로필 보기
              </Button>
            )}
            {isAuthenticated ? (
              <Button
                size="full"
                className="h-10"
                disabled={isCreatingChat}
                onClick={() =>
                  createDirectChat(
                    { data: { memberId: item.memberId } },
                    {
                      onSuccess: (chatId) => openPanel(`messages/${chatId}`),
                      onError: (error) =>
                        toast({
                          description: isApiErrorShape(error)
                            ? error.message
                            : '대화를 시작하지 못했어요. 다시 시도해주세요',
                          variant: 'error',
                        }),
                    }
                  )
                }
              >
                메시지 보내기
              </Button>
            ) : (
              <Button size="full" className="h-10" onClick={requireLogin}>
                메시지 보내기
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 세로 divider */}
      <div className="w-px shrink-0 self-stretch bg-gray-100" />

      {/* 우측: 통계 + 작업물 썸네일 */}
      <div className="flex w-[422px] shrink-0 flex-col gap-[22px]">
        {/* 통계 3개 */}
        <div className="flex gap-8">
          <Stat value={item.postCount} label="작업물" />
          <Stat value={item.coworkerCount} label="동료" />
          <Stat value={item.recommendCount} label="추천서" />
        </div>

        {/* 작업물 썸네일 3개 — 포트폴리오 BE 도메인 미구현 */}
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
