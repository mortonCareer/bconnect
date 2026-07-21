'use client'

import { useGetCrawledMember, TRADE_LABELS } from '@bconnect/api-client'
import { PanelAside, PanelScroll, PanelShell } from '@bconnect/features'
import { Button, ImageCarousel, SkillTag } from '@bconnect/ui'
import { usePanelNav } from '@/hooks/usePanelNav'
import { toCrawledDisplay } from '@/lib/crawled'
import { CrawledImage, CrawledSourceBadge } from '../CrawledImage'

/**
 * 크롤링 기술자 상세 패널 — 전시 전용 (회원 아님).
 * 회원 프로필 패널(ProfileView)과 같은 골격: 헤더(아바타+통계+메타) → 작업물.
 * 동료·추천서는 크롤링에 없는 개념이라 통계는 작업물 수만 둔다.
 *
 * @figma-scaffold 크롤링 상세 시안 없음 — PanelProfile(ProfileView) 골격 준용
 */
export function PanelCrawled({ crawledId }: { crawledId: number }) {
  const { closeHref, close } = usePanelNav()

  const enabled = Number.isFinite(crawledId) && crawledId > 0
  const { data, isLoading, isError } = useGetCrawledMember(crawledId, { query: { enabled } })

  const d = data ? toCrawledDisplay(data) : null
  const meta = d
    ? [
        d.companySub,
        d.grade,
        d.experienceYears != null ? `${d.experienceYears}년` : null,
        d.location || null,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''
  const posts = (data?.posts ?? []).filter((post) => (post.images?.length ?? 0) > 0)

  return (
    <PanelAside label="크롤링 기술자 프로필">
      <PanelShell
        title="프로필"
        closeLabel="프로필 패널 닫기"
        closeHref={closeHref}
        onClose={close}
      >
        <PanelScroll>
          {isLoading && (
            <div className="flex flex-col gap-4 p-4">
              <div className="flex items-center gap-4">
                <div className="h-[100px] w-[100px] shrink-0 animate-pulse rounded-full bg-gray-100" />
                <div className="h-12 w-12 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
            </div>
          )}

          {isError && <p className="p-6 text-m-14 text-gray-500">프로필을 불러오지 못했습니다.</p>}

          {data && d && (
            <>
              {/* 헤더 — 회원 ProfileSummary 레이아웃 (아바타100 + 통계 + 이름/메타/headline) */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 px-4 pt-4">
                  <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-full bg-gray-100">
                    {data.picture && (
                      <CrawledImage
                        src={data.picture}
                        alt={d.displayName}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  {/* 회원 ProfileSummary 통계 레이아웃과 동일 (justify-around 3칸) — 아바타와의
                      간격을 회원 패널과 일치시킴. 크롤링은 동료·추천서가 없어 그 두 칸은 투명 placeholder */}
                  <div className="flex flex-1 justify-around">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sb-16 text-gray-900">{posts.length}</span>
                      <span className="text-r-14 text-gray-900">작업물</span>
                    </div>
                    <div aria-hidden className="flex flex-col items-center gap-1 opacity-0">
                      <span className="text-sb-16">0</span>
                      <span className="text-r-14">동료</span>
                    </div>
                    <div aria-hidden className="flex flex-col items-center gap-1 opacity-0">
                      <span className="text-sb-16">0</span>
                      <span className="text-r-14">추천서</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 px-4 py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sb-20 text-gray-900">{d.displayName}</span>
                    {meta && <span className="text-r-12 text-gray-500">{meta}</span>}
                  </div>
                  {d.headline && <p className="text-r-14 text-gray-900">{d.headline}</p>}
                  <CrawledSourceBadge />
                  {d.trades.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {d.trades.map((trade) => (
                        <SkillTag
                          key={trade}
                          label={TRADE_LABELS[trade] ?? trade}
                          selected={trade === d.primaryTrade}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 액션 — 전화 문의 / 블로그 보기 (회원의 actionSlot 위치) */}
              <div className="flex gap-2.5 px-4 pb-2">
                {data.phone && (
                  <Button asChild size="full" className="h-10">
                    <a href={`tel:${data.phone}`}>전화 문의</a>
                  </Button>
                )}
                {d.sourceUrl && (
                  <Button asChild variant="outline" size="full" className="h-10">
                    <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer">
                      블로그 보기
                    </a>
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-6 py-6">
                {posts.length === 0 ? (
                  <div className="flex items-center justify-center py-20">
                    <p className="text-r-14 text-gray-500">작업물이 없습니다</p>
                  </div>
                ) : (
                  posts.map((post, i) => {
                    // 회원 WorkCard 레이아웃 준용 — 시공 사진 캐러셀(no-referrer) + 제목/본문
                    const images = (post.images ?? []).slice(0, 10)
                    return (
                      <div key={post.id ?? i} className="flex flex-col">
                        {images.length > 0 && (
                          <div className="px-4">
                            <ImageCarousel
                              images={images}
                              alt={post.title ?? '시공 사진'}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-1 px-4 pt-3 pb-4">
                          {post.title && <p className="text-m-16 text-gray-900">{post.title}</p>}
                          {post.content && (
                            <p className="line-clamp-2 text-r-14 text-gray-500">{post.content}</p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </PanelScroll>
      </PanelShell>
    </PanelAside>
  )
}
