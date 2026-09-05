'use client'

import { useGetTasks } from '@bconnect/api-client'
import { gridRangeOf } from '../_components/calendar/date-helpers'
import { toAssigneeCalendarTask, toWorkerCalendarTask } from '../_components/calendar/mapper'

/**
 * 한 월(그리드 가시 범위)의 작업 조회 → 캘린더 뷰모델 목록.
 * fetch 범위는 monthStart..monthEnd 가 아니라 6주 그리드 전체(gridRangeOf) — 인접월 spillover 바도 채운다.
 * 응답은 용도별로 갈린 두 배열이므로(#1176) 각각 변환해 합친 뒤 범위를 거른다.
 */
export function useMonthTasks(month: string) {
  const { start, end } = gridRangeOf(month)
  const query = useGetTasks()
  const tasks = [
    ...(query.data?.workerTasks ?? []).map(toWorkerCalendarTask),
    ...(query.data?.assigneeTasks ?? []).map(toAssigneeCalendarTask),
  ].filter((task) => task.start <= end && task.end >= start)
  return { tasks, isError: query.isError, refetch: query.refetch }
}
