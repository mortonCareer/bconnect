'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@bconnect/ui'

interface NavItem {
  href: string
  label: string
  icon: React.FC<{ active: boolean }>
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: '홈', icon: HomeIcon },
  { href: '/jobs', label: '공고', icon: JobsIcon, disabled: true },
  { href: '/upload', label: '업로드', icon: UploadIcon, disabled: true },
  { href: '/profile', label: '내 정보', icon: ProfileIcon },
]

export function BottomNav() {
  const pathname = usePathname()

  // 채팅 상세 페이지에서는 BottomNav 숨김
  if (/^\/messages\/\d+/.test(pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-300 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-[70px] max-w-screen-sm items-center justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon, disabled }) => {
          const isActive =
            !disabled && (href === '/' ? pathname === '/' : pathname.startsWith(href))

          if (disabled) {
            return (
              <span
                key={href}
                className="flex w-11 cursor-not-allowed flex-col items-center gap-1 text-gray-500 opacity-40"
              >
                <Icon active={false} />
                <span className="text-m-12 leading-[1.6]">{label}</span>
              </span>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex w-11 flex-col items-center gap-1 transition-colors',
                isActive ? 'text-primary' : 'text-gray-500'
              )}
            >
              <Icon active={isActive} />
              <span
                className={cn(
                  'text-[12px] leading-[1.6]',
                  isActive ? 'font-semibold' : 'font-medium'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/* Figma Design System node 603:3461 — 아이콘 SVG paths */

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <g transform="translate(1.833 1.0)">
        <path
          d="M0.666 7.333C0.666 7.091 0.719 6.852 0.821 6.632C0.923 6.412 1.072 6.217 1.257 6.06L7.091 1.06C7.391 0.806 7.773 0.666 8.166 0.666C8.56 0.666 8.941 0.806 9.242 1.06L15.076 6.06C15.261 6.217 15.41 6.412 15.512 6.632C15.614 6.852 15.667 7.091 15.666 7.333V14.833C15.666 15.276 15.491 15.699 15.178 16.012C14.866 16.325 14.442 16.5 14.0 16.5H2.333C1.891 16.5 1.467 16.325 1.155 16.012C0.842 15.699 0.666 15.276 0.666 14.833V7.333Z"
          stroke="currentColor"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
        />
      </g>
      <g transform="translate(6.833 9.333)">
        <path
          d="M5.666 8.166V1.5C5.666 1.279 5.579 1.067 5.422 0.911C5.266 0.754 5.054 0.666 4.833 0.666H1.5C1.279 0.666 1.067 0.754 0.911 0.911C0.754 1.067 0.666 1.279 0.666 1.5V8.166"
          stroke={active ? 'white' : 'currentColor'}
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

function JobsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <g transform="translate(2.667 1.0)">
        <path
          d="M2.333 17.333C1.891 17.333 1.467 17.158 1.155 16.845C0.842 16.532 0.666 16.109 0.666 15.666V2.333C0.666 1.891 0.842 1.467 1.155 1.155C1.467 0.842 1.891 0.666 2.333 0.666H9.0C9.264 0.666 9.525 0.718 9.769 0.819C10.012 0.92 10.234 1.068 10.42 1.255L13.41 4.245C13.597 4.431 13.746 4.653 13.847 4.897C13.948 5.141 14.0 5.402 14.0 5.666V15.666C14.0 16.109 13.824 16.532 13.512 16.845C13.199 17.158 12.775 17.333 12.333 17.333H2.333Z"
          stroke="currentColor"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
        />
      </g>
      <g transform="translate(11.0 1.0)">
        <path
          d="M0.666 0.666V4.833C0.666 5.054 0.754 5.266 0.911 5.422C1.067 5.579 1.279 5.666 1.5 5.666H5.666"
          stroke={active ? 'white' : 'currentColor'}
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(6.0 6.83)">
        <path
          d="M2.333 0.666H0.666"
          stroke={active ? 'white' : 'currentColor'}
          strokeWidth="1.33"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(6.0 10.17)">
        <path
          d="M7.333 0.666H0.666"
          stroke={active ? 'white' : 'currentColor'}
          strokeWidth="1.33"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(6.0 13.5)">
        <path
          d="M7.333 0.666H0.666"
          stroke={active ? 'white' : 'currentColor'}
          strokeWidth="1.33"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

function UploadIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <g transform="translate(9.33 1.833)">
        <path
          d="M0.666 0.666V10.666"
          stroke="currentColor"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(5.167 1.833)">
        <path
          d="M9.0 4.833L4.833 0.666L0.666 4.833"
          stroke="currentColor"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(1.833 11.833)">
        <path
          d="M15.666 0.666V4.0C15.666 4.442 15.491 4.866 15.178 5.178C14.866 5.491 14.442 5.666 14.0 5.666H2.333C1.891 5.666 1.467 5.491 1.155 5.178C0.842 4.866 0.666 4.442 0.666 4.0V0.666"
          stroke="currentColor"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <g transform="translate(3.5 11.833)">
        <path
          d="M12.333 5.666V4.0C12.333 3.116 11.982 2.268 11.357 1.643C10.732 1.018 9.884 0.666 9.0 0.666H4.0C3.116 0.666 2.268 1.018 1.643 1.643C1.018 2.268 0.666 3.116 0.666 4.0V5.666"
          stroke="currentColor"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(6.0 1.833)">
        <path
          d="M4.0 7.333C5.841 7.333 7.333 5.841 7.333 4.0C7.333 2.159 5.841 0.666 4.0 0.666C2.159 0.666 0.666 2.159 0.666 4.0C0.666 5.841 2.159 7.333 4.0 7.333Z"
          stroke="currentColor"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
        />
      </g>
    </svg>
  )
}
