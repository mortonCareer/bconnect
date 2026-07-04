import { daysBetween } from '@bconnect/config/date'
import { MAX_LANES } from './constants'
import { buildMonthMatrix, clampSegmentToWeek } from './date-helpers'
import type { BarSegment, CalendarTask, WeekRowModel } from './types'

/**
 * 월 그리드(6×7)를 주(週)행별 바 레이아웃으로 변환.
 *
 * 각 주행마다: 작업을 그 주 범위로 세그먼트화 → 시작 asc·길이 desc 정렬 →
 * 그리디 레인 배정(첫 빈 레인, 없으면 새 레인). MAX_LANES 초과 레인은 바 대신
 * 해당 열들의 overflowByDay 카운트("+N")로 접는다.
 */
export function buildWeekRows(monthIso: string, tasks: CalendarTask[]): WeekRowModel[] {
  return buildMonthMatrix(monthIso).map((cells) => {
    const weekStart = cells[0]!
    const weekEnd = cells[6]!

    const clamped = tasks
      .map((task) => {
        const seg = clampSegmentToWeek(task.start, task.end, weekStart, weekEnd)
        return seg ? { task, seg } : null
      })
      .filter((x): x is { task: CalendarTask; seg: { start: string; end: string } } => x !== null)
      .sort((a, b) => {
        if (a.seg.start !== b.seg.start) return a.seg.start < b.seg.start ? -1 : 1
        // 같은 시작이면 긴 작업 먼저 (안정적 바)
        return daysBetween(b.seg.start, b.seg.end) - daysBetween(a.seg.start, a.seg.end)
      })

    const laneEnds: number[] = [] // 레인별 마지막 점유 열(exclusive)
    const segments: BarSegment[] = []
    const overflowByDay = [0, 0, 0, 0, 0, 0, 0]

    for (const { task, seg } of clamped) {
      const colStart = daysBetween(weekStart, seg.start)
      const colSpan = daysBetween(seg.start, seg.end) + 1
      const colEnd = colStart + colSpan

      let lane = laneEnds.findIndex((end) => end <= colStart)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(colEnd)
      } else {
        laneEnds[lane] = colEnd
      }

      if (lane >= MAX_LANES) {
        for (let c = colStart; c < colEnd; c++) overflowByDay[c]! += 1
        continue
      }

      segments.push({
        task,
        colStart,
        colSpan,
        lane,
        continuesLeft: task.start < weekStart,
        continuesRight: task.end > weekEnd,
      })
    }

    return { cells, segments, overflowByDay }
  })
}
