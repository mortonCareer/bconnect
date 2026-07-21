import { daysBetween } from '@bconnect/config/date'

/** "12.25 - 12.26 (총 2일)" — 캘린더 formatPeriod 와 달리 "소요" 없이, 구분자 가변(리스트 '-'/카드 '~'). */
export function formatWorkPeriod(start: string, end: string, sep = '-'): string {
  const md = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`
  const days = daysBetween(start, end) + 1
  return `${md(start)} ${sep} ${md(end)} (총 ${days}일)`
}

/** 캘린더 BAR_PALETTE 와 같은 색 계열·같은 id 기반 배정의 진한 점 팔레트. */
const DOT_PALETTE = [
  'bg-rose-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-violet-500',
] as const

export function taskDotColor(id: number): string {
  return DOT_PALETTE[id % DOT_PALETTE.length] ?? DOT_PALETTE[0]
}
