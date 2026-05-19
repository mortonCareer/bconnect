'use client'

export type NavButtonProps = {
  label: string
  badgeCount?: number
  active?: boolean
  onClick?: () => void
}

const DEFAULT_PLACEHOLDER_HANDLER = () => {
  // Phase 2 결정: 미구현 CTA 는 "준비 중" alert 노출
  alert('준비 중')
}

export function NavButton(props: NavButtonProps) {
  const { label, badgeCount, active = false, onClick } = props
  const handleClick = onClick ?? DEFAULT_PLACEHOLDER_HANDLER

  return (
    <button
      type="button"
      data-active={active}
      onClick={handleClick}
      className={[
        'flex h-[44px] w-full items-center justify-between rounded-[8px] px-[12px]',
        'text-r-14 text-bconnect-gray-900',
        active ? 'bg-bconnect-gray-100' : 'bg-transparent hover:bg-bconnect-gray-100',
      ].join(' ')}
    >
      <span style={{ lineHeight: 1.6 }}>{label}</span>
      {badgeCount && badgeCount > 0 ? (
        <span
          data-testid="badge"
          className="text-r-12 flex size-[20px] items-center justify-center rounded-full bg-bconnect-error font-bold text-white"
          style={{ lineHeight: 'normal' }}
        >
          {badgeCount}
        </span>
      ) : null}
    </button>
  )
}
