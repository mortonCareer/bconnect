import { addDays, daysBetween, monthStartOf, toIsoDate } from '@bconnect/config/date'

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

/** ISO 'YYYY-MM-DD' 의 요일 (0=일 … 6=토). 문자열이 UTC 자정이라 getUTCDay 로 안정적. */
export function weekdayOf(iso: string): number {
  return new Date(iso).getUTCDay()
}

export function isSameMonth(iso: string, monthIso: string): boolean {
  return iso.slice(0, 7) === monthIso.slice(0, 7)
}

/** monthIso(='YYYY-MM-01') 에서 delta 개월 이동한 1일. */
export function monthShift(monthIso: string, delta: number): string {
  const y = Number(monthIso.slice(0, 4))
  const m = Number(monthIso.slice(5, 7))
  return toIsoDate(new Date(Date.UTC(y, m - 1 + delta, 1)))
}

/** 6주 그리드의 첫 셀 = 그 달 1일 직전(또는 당일) 일요일. */
function gridStartOf(monthIso: string): string {
  const first = monthStartOf(monthIso)
  return addDays(first, -weekdayOf(first))
}

/** 6×7 ISO 매트릭스 (인접월 spillover 셀 포함). */
export function buildMonthMatrix(monthIso: string): string[][] {
  const start = gridStartOf(monthIso)
  const weeks: string[][] = []
  for (let w = 0; w < 6; w++) {
    const week: string[] = []
    for (let d = 0; d < 7; d++) week.push(addDays(start, w * 7 + d))
    weeks.push(week)
  }
  return weeks
}

/** 그리드 전체 가시 범위(=API fetch 범위). 첫 셀 ~ 마지막 셀(42일). */
export function gridRangeOf(monthIso: string): { start: string; end: string } {
  const start = gridStartOf(monthIso)
  return { start, end: addDays(start, 41) }
}

/** 작업 [taskStart,taskEnd] 와 주행 [weekStart,weekEnd] 의 교집합. 없으면 null. */
export function clampSegmentToWeek(
  taskStart: string,
  taskEnd: string,
  weekStart: string,
  weekEnd: string
): { start: string; end: string } | null {
  const s = taskStart > weekStart ? taskStart : weekStart
  const e = taskEnd < weekEnd ? taskEnd : weekEnd
  return s <= e ? { start: s, end: e } : null
}

/** 특정 일(iso)이 작업 기간에 포함되는지. */
export function dayInTask(iso: string, taskStart: string, taskEnd: string): boolean {
  return taskStart <= iso && iso <= taskEnd
}

/** "12.25 - 12.26 (총 2일 소요)" — 작업기간 표시. */
export function formatPeriod(start: string, end: string): string {
  const md = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`
  const days = daysBetween(start, end) + 1
  return `${md(start)} - ${md(end)} (총 ${days}일 소요)`
}

/** 헤더 표기 — { month: '1월', year: '2025' }. */
export function formatMonthHeader(monthIso: string): { month: string; year: string } {
  return { month: `${Number(monthIso.slice(5, 7))}월`, year: monthIso.slice(0, 4) }
}
