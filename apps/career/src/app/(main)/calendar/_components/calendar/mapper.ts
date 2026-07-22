import { TaskStatus, TaskType } from '@bconnect/api-client'
import type { Task } from '@bconnect/api-client'
import type { CalendarTask } from './types'

/**
 * API Task → 캘린더 뷰모델.
 * - worker task: workerTitle/workerCompany/workerMemo/address
 * - project task: projectTitle/projectMemo/address(프로젝트 주소)
 */
export function toCalendarTask(task: Task): CalendarTask | null {
  // TODO: BE required 처리 후 type narrowing 필요. 캘린더 바 필수값이 optional emit이라 없는 행은 임시로 렌더 제외.
  const { id, start, end } = task
  if (id == null || !start || !end) return null

  // TODO: BE required 처리 후 type narrowing 필요.
  // type/status/title/memo/trades가 optional emit이라 누락 시 관리 액션·상태·제목·메모·공종이 silent fallback 됨.
  const isWorkerTask = task.type === TaskType.WORKER
  const title = task.workerTitle ?? task.projectTitle ?? '제목 없음'
  const memo = task.workerMemo ?? task.projectMemo ?? ''

  return {
    id,
    title,
    start,
    end,
    colorIndex: id,
    isProposed: task.offer != null || task.status === TaskStatus.OFFERED,
    canManage: isWorkerTask,
    company: task.workerCompany ?? undefined,
    address: task.address ?? undefined,
    trades: task.trades ?? [],
    memo,
    raw: task,
  }
}
