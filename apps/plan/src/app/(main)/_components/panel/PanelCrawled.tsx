'use client'

import { useGetCrawledMember, TRADE_LABELS } from '@bconnect/api-client'
import { PanelAside, PanelScroll, PanelShell } from '@bconnect/features'
import { Button, SkillTag } from '@bconnect/ui'
import { usePanelNav } from '@/hooks/usePanelNav'
import { toCrawledDisplay } from '@/lib/crawled'
import { CrawledImage, CrawledSourceBadge } from '../CrawledImage'

/**
 * 크롤링 기술자 상세 패널 — 전시 전용 (회원 아님).
 * 소개·시공 사진·연락처·출처 링크만 제공. 메시지/추천서 등 회원 동작 없음.
 *
 * @figma-scaffold 크롤링 상세 시안 없음 — PanelProfile 골격 준용
 */
export function PanelCrawled({ crawledId }: { crawledId: number }) {
  const { closeHref, close } = usePanelNav()

  const enabled = Number.isFinite(crawledId) && crawledId > 0
  const { data, isLoading, isError } = useGetCrawledMember(crawledId, { query: { enabled } })

  const profile = data?.profile
  // 카드와 동일한 표시 파생(대표자명 우선·업체명 병기·지역 라벨·직급 게이트) 공유 — 두 뷰 불일치 방지
  const d = data ? toCrawledDisplay(data) : null
  const metaParts = d
    ? [
        d.companySub,
        d.location || null,
        d.grade,
        d.experienceYears != null ? `${d.experienceYears}년` : null,
      ].filter(Boolean)
    : []
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
            <div className="flex flex-col gap-3 p-6">
              <div className="h-20 w-20 animate-pulse rounded-full bg-gray-100" />
              <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
            </div>
          )}

          {isError && <p className="p-6 text-m-14 text-gray-500">프로필을 불러오지 못했습니다.</p>}

          {data && d && (
            <div className="flex flex-col gap-6 p-6">
              {/* 프로필 요약 */}
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {data.picture && (
                    <CrawledImage
                      src={data.picture}
                      alt={d.displayName}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sb-20 text-gray-900">{d.displayName}</p>
                  {metaParts.length > 0 && (
                    <p className="text-r-14 text-gray-500">{metaParts.join(' · ')}</p>
                  )}
                  <CrawledSourceBadge />
                </div>
              </div>

              {profile?.headline && <p className="text-r-16 text-gray-900">{profile.headline}</p>}

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

              {/* 연락 · 출처 */}
              <div className="flex gap-2.5">
                {data.phone && (
                  <Button asChild size="full" className="h-10">
                    <a href={`tel:${data.phone}`}>전화 문의</a>
                  </Button>
                )}
                {profile?.url && (
                  <Button asChild variant="outline" size="full" className="h-10">
                    <a href={profile.url} target="_blank" rel="noopener noreferrer">
                      블로그 보기
                    </a>
                  </Button>
                )}
              </div>

              {/* 소개 */}
              {profile?.about && (
                <div className="flex flex-col gap-2">
                  <p className="text-sb-16 text-gray-900">소개</p>
                  <p className="text-r-14 whitespace-pre-line text-gray-700">{profile.about}</p>
                </div>
              )}

              {/* 시공 사례 */}
              {posts.length > 0 && (
                <div className="flex flex-col gap-4">
                  <p className="text-sb-16 text-gray-900">시공 사례</p>
                  {posts.map((post, i) => (
                    <div key={post.id ?? i} className="flex flex-col gap-2">
                      {post.title && <p className="text-m-14 text-gray-900">{post.title}</p>}
                      <div className="grid grid-cols-3 gap-1.5">
                        {(post.images ?? []).slice(0, 6).map((imageUrl) => (
                          <div
                            key={imageUrl}
                            className="aspect-square overflow-hidden rounded-[9px] bg-gray-100"
                          >
                            <CrawledImage
                              src={imageUrl}
                              alt={post.title ?? '시공 사진'}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </PanelScroll>
      </PanelShell>
    </PanelAside>
  )
}
