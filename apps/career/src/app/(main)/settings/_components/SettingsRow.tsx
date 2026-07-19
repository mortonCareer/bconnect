import Link from 'next/link'
import { ChevronIcon } from '@bconnect/ui'

interface SettingsRowProps {
  label: string
  href?: string
  onClick?: () => void
}

const rowClassName =
  'flex h-10 w-full items-center justify-between border-b border-gray-300 transition-opacity active:opacity-60'

/** 설정 메뉴 행 — 좌 라벨 + 우 chevron, 하단 divider. href 면 Link, 아니면 onClick */
export function SettingsRow({ label, href, onClick }: SettingsRowProps) {
  const content = (
    <>
      <span className="text-r-14 text-gray-900">{label}</span>
      <ChevronIcon direction="right" size={16} className="text-gray-400" />
    </>
  )

  if (href) {
    return (
      <Link href={href} className={rowClassName}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={rowClassName}>
      {content}
    </button>
  )
}
