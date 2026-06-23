import Link from 'next/link'
import { Button } from '@bconnect/ui'

interface SettingsRowProps {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'outline' | 'destructive'
}

/** 설정 메뉴 행 — full-width 버튼. href 면 Link, 아니면 onClick */
export function SettingsRow({ label, href, onClick, variant = 'outline' }: SettingsRowProps) {
  if (href) {
    return (
      <Button asChild variant={variant} size="sm" className="w-full">
        <Link href={href}>{label}</Link>
      </Button>
    )
  }
  return (
    <Button variant={variant} size="sm" className="w-full" onClick={onClick}>
      {label}
    </Button>
  )
}
