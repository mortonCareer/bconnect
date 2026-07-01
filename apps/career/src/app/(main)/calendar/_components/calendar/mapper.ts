import type { Task } from '@bconnect/api-client'
import type { CalendarTask } from './types'

/**
 * API Task → 캘린더 뷰모델.
 * - title: eventTitle (현장/행사명) 사용
 * - isProposed: profileId === null = 업체 제안작업(미수락). status 필드 추가 전까지의 파생 (mock).
 */
export function toCalendarTask(task: Task): CalendarTask {
  return {
    id: task.id,
    title: task.eventTitle,
    start: task.start,
    end: task.end,
    colorIndex: task.id,
    isProposed: task.profileId == null,
    raw: task,
  }
}
