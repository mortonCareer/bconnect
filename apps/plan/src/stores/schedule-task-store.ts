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
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
  },
  deleteTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },
}))
