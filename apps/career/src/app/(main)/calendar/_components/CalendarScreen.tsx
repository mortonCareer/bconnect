'use client'

import { Button, PlusIcon, TopBar } from '@bconnect/ui'
import { useCalendarParams } from '../_hooks/useCalendarParams'
import { useMonthTasks } from '../_hooks/useMonthTasks'
import { CalendarHeader } from './calendar/CalendarHeader'
import { MonthCarousel } from './calendar/MonthCarousel'
import { dayInTask, monthShift } from './calendar/date-helpers'
import { TaskDetailCard } from './detail/TaskDetailCard'

/**
 * 캘린더 화면 오케스트레이터. nuqs 월/선택일 + 데이터 훅을 묶고,
 * 셸(TopBar·헤더)은 즉시 렌더, 그리드는 API 도착 후 채움. 에러 시 그리드 자리에 재시도.
 */
export function CalendarScreen() {
  const { month, day, selectDay, setMonth } = useCalendarParams()
  const { tasks, isError, refetch } = useMonthTasks(month)

  const selectedTasks = tasks.filter((t) => dayInTask(day, t.start, t.end))

  return (
    <div className="bg-white">
      <TopBar
        variant="default"
        showBack={false}
        actionIcon={<PlusIcon />}
        actionLabel="작업 생성"
        actionHref="/calendar/new"
      />
      <CalendarHeader
        monthIso={month}
        onPrev={() => setMonth(monthShift(month, -1))}
        onNext={() => setMonth(monthShift(month, 1))}
      />

      {isError ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-m-14 text-gray-400">작업을 불러오지 못했어요</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            다시 시도
          </Button>
        </div>
      ) : (
        <MonthCarousel
          month={month}
          selectedDay={day}
          onSelectDay={selectDay}
          onMonthChange={setMonth}
        />
      )}

      {!isError && selectedTasks.length > 0 && (
        <div className="mt-2 divide-y divide-gray-100 border-t border-gray-100">
          {selectedTasks.map((t) => (
            <TaskDetailCard key={t.id} task={t} selectedDay={day} selectedMonth={month} />
          ))}
        </div>
      )}
    </div>
  )
}
