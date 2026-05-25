/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1504-13254
 */
'use client'

import Image from 'next/image'
import { useGetMyMember, useGetMyChats } from '@bconnect/api-client'
import { getAvatarUrl } from '@/lib/avatar'
import { SidebarFooter } from './SidebarFooter'

// TODO(신규 BE 이슈 필요 — notification 도메인): 엔드포인트 추가 시
//   `const { data } = useGetMyNotifications(); const NOTIFICATION_COUNT = data?.unreadCount ?? 0`
//   형태로 교체. count=0 이면 Badge 자동 숨김.
const NOTIFICATION_COUNT = 4

function Badge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[8px] bg-[#FF4242] px-1 text-sb-12 text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

interface NavItemProps {
  label: string
  count: number
  onClick: () => void
}

// TODO: #381 — utils.ts 이슈 수정 후 스타일 반영
function NavItem({ label, count, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[44px] w-full items-center justify-between rounded-[8px] px-3 text-r-14 text-bconnect-gray-900 hover:bg-bconnect-gray-100"
    >
      <span>{label}</span>
      <Badge count={count} />
    </button>
  )
}

function ProfileSection() {
  const { data: member, isLoading } = useGetMyMember()

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-bconnect-gray-100" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-20 animate-pulse rounded bg-bconnect-gray-100" />
          <div className="h-3 w-16 animate-pulse rounded bg-bconnect-gray-100" />
        </div>
      </div>
    )
  }

  const displayName = member?.name ? `${member.name}님` : ''

  // BE 가 실제 업로드 URL (S3 등) 을 내려주면 그대로 사용. null 또는 MSW faker 의 placehold URL 이면
  // dicebear 아바타로 폴백 — Figma 일러스트 톤과 유사. 운영에서도 사진 미업로드 회원은 자연 폴백.
  const avatarUrl =
    member?.picture && !/placehold\.co|placeholder\.com/i.test(member.picture)
      ? member.picture
      : getAvatarUrl(member?.name ?? '회원')

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-bconnect-gray-100">
        <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-sb-16 text-bconnect-gray-900">{displayName}</p>
        {/* TODO(신규 BE 이슈 필요 — Corporation 도메인): Member schema 에 업체명 필드 추가 시
            `{member?.corporation?.name ?? ''}` 등으로 교체. */}
        <p className="truncate text-r-12 text-bconnect-gray-500">OO디자인</p>
      </div>
    </div>
  )
}

export function MemberSidebar() {
  const { data: chats } = useGetMyChats()
  const messageCount = chats?.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) ?? 0

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-col gap-5 px-5 py-7">
        <ProfileSection />
        <div className="h-px bg-bconnect-gray-300" />
        <div className="flex flex-col gap-0.5">
          <NavItem
            label="알림"
            count={NOTIFICATION_COUNT}
            onClick={() => {
              /* TODO #347 — NotificationsPanel 트리거 */
            }}
          />
          <NavItem
            label="메시지"
            count={messageCount}
            onClick={() => {
              /* TODO #345 — MessagesPanel 트리거 */
            }}
          />
        </div>
      </div>

      <SidebarFooter />
    </div>
  )
}
