'use client'

import Image from 'next/image'
import { EditIcon } from '@bconnect/ui'

// Figma profile_image 컴포넌트 (node 3393-3704) — edit 배지 표시/숨김 (#966).
// owner 어댑터가 onEdit 을 주입하면 배지 노출, viewer/plan 은 미주입으로 숨김.
interface ProfileImageProps {
  src: string
  alt: string
  /** 있으면 우하단 edit 배지 렌더 (owner 전용) */
  onEdit?: () => void
  /** 업로드 진행 중 — 배지 비활성 */
  uploading?: boolean
}

export function ProfileImage({ src, alt, onEdit, uploading }: ProfileImageProps) {
  return (
    <div className="relative size-[100px] shrink-0">
      <div className="relative size-full overflow-hidden rounded-full bg-gray-100">
        {/* TODO: 출시 전 unoptimized 제거 + next/image remotePatterns/loader 구성 (외부 업로드 대응) */}
        <Image src={src} alt={alt} fill sizes="100px" unoptimized className="object-cover" />
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          disabled={uploading}
          aria-label="프로필 이미지 수정"
          className="absolute bottom-0 right-0 flex size-6 cursor-pointer items-center justify-center rounded-full bg-gray-900 text-white outline-none transition-all hover:opacity-80 focus-visible:ring-1 focus-visible:ring-primary active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <EditIcon size={13} />
        </button>
      )}
    </div>
  )
}
