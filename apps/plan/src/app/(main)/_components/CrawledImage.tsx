// 네이버 CDN 이미지는 외부 사이트에서 요청 시 Referer 헤더를 보고 403 차단한다.
// referrerPolicy="no-referrer" 로 Referer 를 아예 안 보내면 원본 로드가 통과한다.
// next/image Optimizer 는 서버 fetch라 이 정책을 못 실으므로 plain <img> 를 쓴다.
export function CrawledImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  return <img src={src} alt={alt} referrerPolicy="no-referrer" className={className} />
}

/** 크롤링 프로필임을 알리는 출처 뱃지 — 카드·상세 패널 공용 */
export function CrawledSourceBadge() {
  return (
    <span className="w-fit rounded-full bg-gray-100 px-2.5 py-0.5 text-r-12 text-gray-600">
      네이버 블로그에서 수집한 프로필
    </span>
  )
}
