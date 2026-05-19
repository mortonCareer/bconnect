import type { SidebarProjectMenuItem, SidebarUser } from './types'
import { NavButton } from './nav-button'

export type MemberSidebarProps = {
  user: SidebarUser
  notificationCount: number
  messageCount: number
  selectedProject: { id: string; name: string }
  projectMenu: SidebarProjectMenuItem[]
  activeSlug: SidebarProjectMenuItem['slug']
}

export function MemberSidebar(props: MemberSidebarProps) {
  const { user, notificationCount, messageCount, selectedProject, projectMenu, activeSlug } = props

  return (
    <aside
      aria-label="공정표 사이드바"
      data-testid="member-sidebar"
      className="flex min-h-screen w-[270px] shrink-0 flex-col justify-between border-r border-bconnect-gray-300 bg-white"
    >
      {/* 상단 컨텐츠 영역 */}
      <div className="flex flex-col gap-[40px] px-[20px] py-[28px]">
        {/* 프로필 + 알림/메시지/기술자 탐색 nav */}
        <div className="flex flex-col gap-[20px]">
          {/* 프로필 */}
          <div
            data-testid="sidebar-profile"
            className="flex h-[44px] w-[229px] items-center gap-[12px]"
          >
            <div
              aria-hidden="true"
              className="size-[44px] shrink-0 rounded-full bg-bconnect-gray-300"
            />
            <div className="flex flex-col gap-[2px]">
              <p
                className="text-sb-16 whitespace-nowrap text-bconnect-gray-900"
                style={{ lineHeight: 1.6 }}
              >
                {user.name}
              </p>
              <p
                className="text-r-12 whitespace-nowrap text-bconnect-gray-500"
                style={{ lineHeight: 1.6 }}
              >
                {user.role}
              </p>
            </div>
          </div>

          {/* divider */}
          <div className="h-px w-[229px] bg-bconnect-gray-300" aria-hidden="true" />

          {/* 주요 메뉴 (알림 / 메시지 / 기술자 탐색) */}
          <nav aria-label="주요 메뉴" className="flex w-[229px] flex-col gap-[2px]">
            <NavButton label="알림" badgeCount={notificationCount} />
            <NavButton label="메시지" badgeCount={messageCount} />
            <NavButton label="기술자 탐색" active />
          </nav>
        </div>

        {/* 프로젝트 섹션 */}
        <section aria-label="프로젝트 메뉴" className="flex w-[229px] flex-col gap-[12px]">
          <p
            className="font-semibold uppercase text-bconnect-gray-500"
            style={{
              fontSize: '11px',
              lineHeight: '16.5px',
              letterSpacing: '0.44px',
              paddingLeft: '4px',
            }}
          >
            프로젝트
          </p>

          <div className="flex w-full flex-col gap-[4px]">
            {/* 프로젝트 dropdown (현재 선택된 프로젝트 표시) */}
            <button
              type="button"
              aria-label={`현재 프로젝트: ${selectedProject.name}`}
              className="flex h-[40px] w-full items-center justify-between rounded-[8px] border border-bconnect-gray-300 bg-white px-[10px]"
            >
              <span
                className="text-m-14 whitespace-nowrap text-bconnect-gray-900"
                style={{ lineHeight: 1.6 }}
              >
                {selectedProject.name}
              </span>
              <ChevronDownIcon />
            </button>

            {/* 프로젝트 하위 메뉴 */}
            <ul className="flex flex-col">
              {projectMenu.map((item) => {
                const isActive = item.slug === activeSlug
                return (
                  <li key={item.slug}>
                    <a
                      href={`/projects/${selectedProject.id}/${item.slug}`}
                      data-active={isActive}
                      className={[
                        'flex h-[40px] w-full items-center rounded-[8px] pl-[12px] pr-[12px]',
                        isActive ? 'bg-bconnect-gray-100' : 'bg-transparent',
                      ].join(' ')}
                    >
                      <span
                        className="whitespace-nowrap text-bconnect-gray-700"
                        style={{ fontSize: '13px', lineHeight: '19.5px', fontWeight: 400 }}
                      >
                        {item.label}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      </div>

      {/* 하단 플와이 footer */}
      <footer
        data-testid="sidebar-plan"
        className="flex w-full flex-col items-start gap-[12px] p-[20px]"
      >
        <div
          aria-label="플와이"
          className="flex h-[24px] w-[70px] items-center text-bconnect-primary"
          style={{
            fontSize: '18px',
            lineHeight: 1.2,
            fontWeight: 700,
            letterSpacing: '-0.5px',
          }}
        >
          플와이
        </div>
        <p
          className="whitespace-nowrap text-bconnect-gray-500"
          style={{ fontSize: '11px', lineHeight: '16.5px', fontWeight: 400 }}
        >
          무료 요금제
        </p>
      </footer>
    </aside>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M3.2 6L8 10.067L12.8 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-bconnect-gray-900"
      />
    </svg>
  )
}
