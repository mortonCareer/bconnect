'use client'

interface ProfileHeaderProps {
  name?: string
  picture?: string
  city?: string
  headline?: string | null
}

export function ProfileHeader({ name, picture, city, headline }: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-5 px-4 py-6">
      {/* 아바타 */}
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-morton-gray-300">
        {picture ? (
          <img src={picture} alt={name ?? '프로필'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sb-24 text-morton-gray-500">
            {name?.charAt(0) ?? '?'}
          </div>
        )}
      </div>

      {/* 이름 + 지역 + 한줄소개 */}
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sb-20 text-morton-gray-900">{name ?? '이름 없음'}</span>
          {city && <span className="text-r-12 text-morton-gray-500">{city}</span>}
        </div>
        {headline && <p className="truncate text-r-14 text-morton-gray-900">{headline}</p>}
      </div>
    </div>
  )
}
