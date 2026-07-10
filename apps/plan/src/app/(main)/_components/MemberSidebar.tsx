'use client'

import { usePanelNav } from '@/hooks/usePanelNav'
import { useGetMyMember } from '@bconnect/api-client'
import { useUnreadChatCount } from '@bconnect/features'
import { getAvatarUrl } from '@bconnect/config/avatar'
import { Select } from '@bconnect/ui'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { MOCK_PROJECTS } from '@/app/(main)/projects/[projectId]/schedule/_components/mock'
import { SidebarFooter } from './SidebarFooter'

// TODO(신규 BE 이슈 필요 — notification 도메인): 엔드포인트 추가 시
//   `const { data } = useGetMyNotifications(); const NOTIFICATION_COUNT = data?.unreadCount ?? 0`
//   형태로 교체. count=0 이면 CountBadge 자동 숨김.
const NOTIFICATION_COUNT = 4
const MAX_BADGE_COUNT = 99

const PROJECT_OPTIONS = MOCK_PROJECTS.map((p) => ({ value: p.id, label: p.name }))

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
      {count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : count}
    </span>
  )
}

interface NavItemProps {
  label: string
  count: number
  href?: string
  onClick?: () => void
  active?: boolean
}

const NAV_ITEM_CLASS =
  'flex h-[44px] w-full items-center justify-between rounded-[8px] px-3 text-r-14 text-gray-900 hover:bg-gray-100'

function NavItem({ label, count, href, onClick, active }: NavItemProps) {
  const className = `${NAV_ITEM_CLASS} ${active ? 'bg-gray-100' : ''}`
  const inner = (
    <>
      <span>{label}</span>
      <CountBadge count={count} />
    </>
  )
  return href ? (
    <Link href={href} scroll={false} className={className}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  )
}

type ProjectMenuItem = { slug: string; label: string; href: string | null }

const PROJECT_ITEM_CLASS =
  'flex h-10 w-full items-center rounded-[8px] px-3 text-[13px] leading-[19.5px]'

function ProjectSection({
  pathProjectId,
  activeSlug,
}: {
  pathProjectId: string | undefined
  activeSlug: string
}) {
  const router = useRouter()
  const [selectedProject, setSelectedProject] = useState(
    pathProjectId ?? PROJECT_OPTIONS[0]?.value ?? ''
  )
  // path 로 다른 프로젝트에 진입하면 셀렉트를 따라가게 동기화 (render-time adjustment)
  const [prevPathId, setPrevPathId] = useState(pathProjectId)
  if (pathProjectId !== prevPathId) {
    setPrevPathId(pathProjectId)
    if (pathProjectId) setSelectedProject(pathProjectId)
  }

  // Select 는 Link 로 표현 불가 — 선택 즉시 해당 프로젝트 공정표로 imperative 이동
  function handleProjectChange(v: string | string[]) {
    const next = Array.isArray(v) ? (v[0] ?? '') : v
    setSelectedProject(next)
    if (next) router.push(`/projects/${next}/schedule`)
  }

  const items: ProjectMenuItem[] = [
    { slug: 'schedule', label: '공정표', href: `/projects/${selectedProject}/schedule` },
    // TODO: 페이지 구현 시 href 연결 (#375 follow-up — 모집 관리)
    { slug: 'recruit', label: '모집 관리', href: null },
    { slug: 'storage', label: '문서 저장소', href: `/projects/${selectedProject}/storage` },
  ]
  // active 표시는 현재 path 의 프로젝트를 보고 있을 때만
  const onSelectedProject = pathProjectId === selectedProject

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.44px] text-gray-400">
        프로젝트
      </p>
      <div className="flex flex-col gap-1">
        <Select
          value={selectedProject}
          onChange={handleProjectChange}
          options={PROJECT_OPTIONS}
          placeholder="프로젝트 선택"
        />
        {items.map((item) => {
          const active = onSelectedProject && item.slug === activeSlug
          return item.href ? (
            <Link
              key={item.slug}
              href={item.href}
              className={`${PROJECT_ITEM_CLASS} ${active ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {item.label}
            </Link>
          ) : (
            <span
              key={item.slug}
              aria-disabled="true"
              className={`${PROJECT_ITEM_CLASS} cursor-not-allowed text-gray-400`}
            >
              {item.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function ProfileSection() {
  const { data: member, isLoading } = useGetMyMember()

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-gray-100" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
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
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {/* TODO: unoptimized 제거 */}
        <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-sb-16 text-gray-900">{displayName}</p>
        {/* TODO(신규 BE 이슈 필요 — Corporation 도메인): Member schema 에 업체명 필드 추가 시
            `{member?.corporation?.name ?? ''}` 등으로 교체. */}
        <p className="truncate text-r-12 text-gray-500">OO디자인</p>
      </div>
    </div>
  )
}

export function MemberSidebar() {
  const messageCount = useUnreadChatCount()
  const { panelHref } = usePanelNav()
  const pathname = usePathname()

  const projectMatch = pathname.match(/^\/projects\/([^/]+)(?:\/([^/]+))?/)
  const projectId = projectMatch?.[1]
  const projectSlug = projectMatch?.[2] ?? ''

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-col gap-5 px-5 py-7">
        <ProfileSection />
        <div className="h-px bg-gray-300" />
        <div className="flex flex-col gap-0.5">
          <NavItem label="알림" count={NOTIFICATION_COUNT} href={panelHref('notifications')} />
          <NavItem label="메시지" count={messageCount} href={panelHref('messages')} />
          <NavItem label="기술자 탐색" count={0} href="/" active={pathname === '/'} />
        </div>
        <ProjectSection pathProjectId={projectId} activeSlug={projectSlug} />
      </div>

      <SidebarFooter />
    </div>
  )
}
