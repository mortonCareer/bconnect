'use client'

import Link from 'next/link'
import { Button, SkillTag } from '@bconnect/ui'
import { TRADE_LABELS } from '@bconnect/api-client'
import type { Trade } from '@bconnect/api-client'
import { usePanelNav } from '@/hooks/usePanelNav'
import type { CrawledTechnicianItem } from '@/hooks/useTechnicianItems'

/**
 * 크롤링 기술자 카드 — 전시 전용 (회원 아님).
 * TechnicianCard 와 같은 카드 골격이되 회원 전용 요소(별점·통계·메시지)는 없고,
 * 출처 표기 + 상세 패널 + 전화/출처 링크만 제공한다.
 *
 * @figma-scaffold 크롤링 카드 시안 없음 — TechnicianCard(1470:6775) 골격 준용
 */

// 네이버 CDN 이미지는 외부 Referer 를 차단(403) — next/image 대신 plain img + no-referrer 로 표시
function CrawledImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} referrerPolicy="no-referrer" className={className} />
}

interface CrawledTechnicianCardProps {
  item: CrawledTechnicianItem
}

export function CrawledTechnicianCard({ item }: CrawledTechnicianCardProps) {
  const { panelHref } = usePanelNav()
  const detailHref = panelHref(`crawled/${item.crawledId}`)

  const metaParts = [
    item.location,
    item.grade,
    item.experienceYears > 0 ? `${item.experienceYears}년` : null,
  ].filter(Boolean)

  return (
    <div className="flex gap-[27px] rounded-[13px] border border-gray-300 bg-white p-7">
      <div className="flex flex-1 gap-[18px]">
        <div className="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-full bg-gray-100">
          {item.picture && (
            <CrawledImage
              src={item.picture}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4">
          {/* 이름 + 메타 + 출처 표기 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2.5">
              <p className="text-sb-20 text-gray-900">{item.name}</p>
              <p className="text-r-14 text-gray-500">{metaParts.join(' · ')}</p>
            </div>
            <span className="w-fit rounded-full bg-gray-100 px-2.5 py-0.5 text-r-12 text-gray-600">
              네이버 블로그에서 수집한 프로필
            </span>
          </div>

          {/* 한 줄 소개 */}
          {item.headline && <p className="line-clamp-2 text-r-16 text-gray-900">{item.headline}</p>}

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

          {/* 액션 — 상세 패널 + 전화 (전화 없으면 출처 링크) */}
          <div className="mt-auto flex gap-2.5">
            <Button asChild variant="outline" size="full" className="h-10">
              <Link href={detailHref} scroll={false}>
                프로필 보기
              </Link>
            </Button>
            {item.phone ? (
              <Button asChild size="full" className="h-10">
                <a href={`tel:${item.phone}`}>전화 문의</a>
              </Button>
            ) : (
              item.sourceUrl && (
                <Button asChild size="full" className="h-10">
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                    블로그 보기
                  </a>
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
