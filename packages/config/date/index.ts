/**
 * 날짜 프리미티브 — 'YYYY-MM-DD' ISO 문자열 기반.
 *
 * 모든 문자열 산술은 ISO 날짜를 UTC 자정으로 해석하므로 타임존과 무관하게 내부 일관적이다.
 * 단 `todayIso()` 만은 사용자 벽시계(로컬)를 따른다 — UTC 로 오늘을 뽑으면 KST 자정~오전 사이 하루가 밀린다.
 */

const ISO_DAY_MS = 86_400_000

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** 로컬(벽시계) 기준 오늘. 기본 선택일/포커스 월의 출처. */
export function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / ISO_DAY_MS)
}

/** task.start~end(양끝 포함) 소요 일수. 파싱 불가·역순이면 undefined. */
export function durationDays(start: string, end: string): number | undefined {
  const days = daysBetween(start, end) + 1
  return Number.isFinite(days) && days >= 1 ? days : undefined
}

export function addDays(iso: string, n: number): string {
  return toIsoDate(new Date(new Date(iso).getTime() + n * ISO_DAY_MS))
}

/** 해당 월의 1일 ('YYYY-MM-01'). */
export function monthStartOf(iso: string): string {
  return `${iso.slice(0, 8)}01`
}

/** 해당 월의 말일. */
export function monthEndOf(iso: string): string {
  return toIsoDate(new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)), 0)))
}
