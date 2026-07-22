'use client'

import { useGetTasks } from '@bconnect/api-client'
import { gridRangeOf } from '../_components/calendar/date-helpers'
import { toCalendarTask } from '../_components/calendar/mapper'

/**
 * 한 월(그리드 가시 범위)의 작업 조회 → 캘린더 뷰모델 목록.
 * fetch 범위는 monthStart..monthEnd 가 아니라 6주 그리드 전체(gridRangeOf) — 인접월 spillover 바도 채운다.
 */
export function useMonthTasks(month: string) {
  const { start, end } = gridRangeOf(month)
  const query = useGetTasks()
  const tasks = (query.data ?? []).flatMap((task) => {
    const calendarTask = toCalendarTask(task)
    return calendarTask && calendarTask.start <= end && calendarTask.end >= start
      ? [calendarTask]
      : []
  })
  return { tasks, isError: query.isError, refetch: query.refetch }
}
