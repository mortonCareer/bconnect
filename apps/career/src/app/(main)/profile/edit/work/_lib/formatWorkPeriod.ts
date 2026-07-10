/** ISO(YYYY-MM-DD) 시작/종료 → "12.25 - 12.26 (총 2일 소요)" 표기. */
export function formatWorkPeriod(start: string, end: string): string {
  const md = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`
  const startMs = Date.parse(start)
  const endMs = Date.parse(end)
  const days = Math.floor((endMs - startMs) / 86_400_000) + 1
  return `${md(start)} - ${md(end)} (총 ${days}일 소요)`
}
