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

/** 'YYYY-MM-DD' 직접 입력 마스킹. 숫자만 남기고 8자리까지 하이픈을 끼운다. */
export function formatIsoDateInput(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 4) return d
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`
}

/**
 * 달력에 실재하는 'YYYY-MM-DD' 인지 판별한다.
 *
 * `Date.parse` 는 못 쓴다 — '2015-02-30' 을 3월 2일로 굴려 유효 판정한다(월 넘침만 NaN).
 * 성분 왕복 비교라야 굴러간 날짜가 걸린다.
 */
export function isCalendarDate(iso: string): boolean {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

/**
 * 만 나이 (생일이 지났으면 +1). BE `Period.between(birth, now).getYears()` 와 같은 값을 낸다.
 * 'MM-DD' 문자열 사전순이 곧 시간순이라 Date 파싱 없이 계산해 타임존과 무관하다.
 */
export function ageInYears(birth: string, on: string = todayIso()): number {
  const years = Number(on.slice(0, 4)) - Number(birth.slice(0, 4))
  return on.slice(5) < birth.slice(5) ? years - 1 : years
}
