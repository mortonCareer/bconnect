import type { AssigneeTask, WorkerTask } from '@bconnect/api-client'
import type { CalendarTask } from './types'

/** 본인 작업 → 캘린더 뷰모델. 섭외 상태가 없고 수정·삭제할 수 있다. */
export function toWorkerCalendarTask(task: WorkerTask): CalendarTask {
  return {
    id: task.id,
    title: task.title,
    start: task.start,
    end: task.end,
    colorIndex: task.id,
    progress: task.progress,
    canManage: true,
    company: task.company ?? undefined,
    address: task.address ?? undefined,
    trades: task.trades,
    requirement: '',
    memo: task.memo ?? '',
  }
}

/** 업체 제안 작업 → 캘린더 뷰모델. 읽기 전용이며 섭외 상태와 요청사항을 가진다. */
export function toAssigneeCalendarTask(task: AssigneeTask): CalendarTask {
  return {
    id: task.id,
    title: task.title,
    start: task.start,
    end: task.end,
    colorIndex: task.id,
    progress: task.progress,
    canManage: false,
    status: task.status,
    address: task.address ?? undefined,
    trades: task.trades,
    requirement: task.requirement ?? '',
    memo: task.memo ?? '',
  }
}
