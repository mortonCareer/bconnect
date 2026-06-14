import { create } from 'zustand'
import type { ScheduleTask } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/types'
import { MOCK_SCHEDULE_TASKS } from '@/app/(main)/projects/[projectId]/schedule/_components/mock'

export type ScheduleTaskInput = Omit<ScheduleTask, 'id'>

interface ScheduleTaskState {
  tasks: ScheduleTask[]
  createTask: (input: ScheduleTaskInput) => string
  updateTask: (id: string, patch: Partial<ScheduleTaskInput>) => void
  deleteTask: (id: string) => void
}

let nextId = MOCK_SCHEDULE_TASKS.length + 1

const SCALAR_KEYS = [
  'ganttName',
  'startDate',
  'endDate',
  'status',
  'corpName',
  'address',
  'addressDetail',
  'request',
  'memo',
] as const

/** patch 적용 결과가 기존과 동일한지 — 동일하면 updateTask 가 no-op (리렌더/루프 차단). */
function isSameTask(cur: ScheduleTask, next: ScheduleTask): boolean {
  if (SCALAR_KEYS.some((k) => cur[k] !== next[k])) return false
  const a = cur.trades ?? []
  const b = next.trades ?? []
  if (a.length !== b.length || a.some((v, i) => v !== b[i])) return false
  return cur.assignee === next.assignee
}

/**
 * 공정표 작업 로컬 상태 seam (#576/#582). 그리드(드래그/리사이즈/삭제)와
 * 작업 생성/편집 패널(PanelTask)이 같은 tasks 를 공유한다.
 * BE 연동(C) 시 이 스토어를 React Query mutation 으로 교체 — 소비처 시그니처 유지.
 */
export const useScheduleTaskStore = create<ScheduleTaskState>()((set) => ({
  tasks: MOCK_SCHEDULE_TASKS,
  createTask: (input) => {
    const id = String(nextId++)
    set((s) => ({ tasks: [...s.tasks, { ...input, id }] }))
    return id
  },
  updateTask: (id, patch) => {
    set((s) => {
      const idx = s.tasks.findIndex((t) => t.id === id)
      if (idx < 0) return s
      const next = { ...s.tasks[idx], ...patch }
      // 값이 동일하면 같은 state 반환 → 구독자 리렌더 안 함 (즉시저장 ↔ 폼 sync 루프 차단)
      if (isSameTask(s.tasks[idx], next)) return s
      const tasks = s.tasks.slice()
      tasks[idx] = next
      return { tasks }
    })
  },
  deleteTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },
}))
