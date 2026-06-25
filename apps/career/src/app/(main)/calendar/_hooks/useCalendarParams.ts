'use client'

import { monthStartOf, todayIso } from '@bconnect/config/date'
import { parseAsString, useQueryStates } from 'nuqs'

/**
 * 캘린더 URL state — 포커스 월(`?month=` 'YYYY-MM-01')과 선택일(`?day=` ISO).
 * 둘 다 default 는 오늘. history:'replace' 로 뒤로가기 스택을 더럽히지 않는다.
 *
 * - selectDay: 선택일과 월을 함께 동기화 (인접월 spillover 셀 클릭 시 그 달로 이동).
 * - setMonth: 월 이동(화살표/스와이프) 시 선택일도 그 달 안으로 옮겨 하이라이트·상세를 일치시킴.
 */
export function useCalendarParams() {
  const today = todayIso()
  const [{ month, day }, setParams] = useQueryStates(
    {
      month: parseAsString.withDefault(monthStartOf(today)),
      day: parseAsString.withDefault(today),
    },
    { history: 'replace' }
  )

  const selectDay = (iso: string) => {
    void setParams({ day: iso, month: monthStartOf(iso) })
  }

  const setMonth = (monthIso: string) => {
    const inThisMonth = monthIso.slice(0, 7) === today.slice(0, 7)
    const nextDay = inThisMonth ? today : `${monthIso.slice(0, 8)}01`
    void setParams({ month: monthIso, day: nextDay })
  }

  return { month, day, today, selectDay, setMonth }
}
