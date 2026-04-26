import { http } from 'msw'
import { ok, notFound } from '../lib/response'
import { tasks } from '../data/seed'

export const tasksHandlers = [
  // 작업 목록
  http.get('*/api/v1/tasks', () => ok(tasks)),

  // 동료가 참여한 작업 목록 — 현재 dev 시나리오에선 전체 tasks 와 동일
  http.get('*/api/v1/coworkers/tasks', () => ok(tasks)),

  // 작업 단건 조회
  http.get('*/api/v1/tasks/:taskId', ({ params }) => {
    const id = parseInt(params.taskId as string, 10)
    const task = tasks.find((t) => t.id === id)
    if (!task) return notFound('작업을 찾을 수 없습니다')
    return ok(task)
  }),
]
