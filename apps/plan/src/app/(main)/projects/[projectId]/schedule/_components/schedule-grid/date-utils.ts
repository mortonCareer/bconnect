const ISO_DAY_MS = 86_400_000

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / ISO_DAY_MS)
}

export function addDays(iso: string, n: number): string {
  return toIsoDate(new Date(new Date(iso).getTime() + n * ISO_DAY_MS))
}

export function monthStartOf(iso: string): string {
  return `${iso.slice(0, 8)}01`
}

export function monthEndOf(iso: string): string {
  return toIsoDate(new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)), 0)))
}

export function buildDates(start: string, end: string): Date[] {
  const out: Date[] = []
  const cursor = new Date(start)
  const last = new Date(end)
  while (cursor.getTime() <= last.getTime()) {
    out.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

export function groupByMonth(dates: Date[]): { month: number; count: number }[] {
  const groups: { month: number; count: number }[] = []
  for (const d of dates) {
    const m = d.getMonth() + 1
    const last = groups[groups.length - 1]
    if (last && last.month === m) {
      last.count += 1
    } else {
      groups.push({ month: m, count: 1 })
    }
  }
  return groups
}
