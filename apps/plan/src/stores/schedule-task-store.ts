import { create } from 'zustand'
import type {
  OfferQueueItem,
  ScheduleTask,
} from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/types'
import { MOCK_SCHEDULE_TASKS } from '@/app/(main)/projects/[projectId]/schedule/_components/mock'

export type ScheduleTaskInput = Omit<ScheduleTask, 'id'>

interface ScheduleTaskState {
  tasks: ScheduleTask[]
  createTask: (input: ScheduleTaskInput) => string
  updateTask: (id: string, patch: Partial<ScheduleTaskInput>) => void
  deleteTask: (id: string) => void
  /** 섭외 대기열 (#575) — 대표 기술자(assignee)는 'offered' 멤버 파생이라 별도 필드 없음. */
  addOffer: (taskId: string, item: OfferQueueItem) => void
  removeOffer: (taskId: string, profileId: number) => void
  reorderOffer: (taskId: string, activeProfileId: number, overProfileId: number) => void
}

let nextId = MOCK_SCHEDULE_TASKS.length + 1

const SCALAR_KEYS = [
  'projectId',
  'ganttName',
  'startDate',
  'endDate',
  'status',
  'draft',
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
  return cur.offerQueue === next.offerQueue
}

/** 한 작업의 offerQueue 만 불변 갱신. fn 이 동일 참조 반환 시 no-op. */
function patchQueue(
  tasks: ScheduleTask[],
  taskId: string,
  fn: (queue: OfferQueueItem[]) => OfferQueueItem[]
): ScheduleTask[] {
  const idx = tasks.findIndex((t) => t.id === taskId)
  if (idx < 0) return tasks
  const cur = tasks[idx].offerQueue ?? []
  const next = fn(cur)
  if (next === cur) return tasks
  const out = tasks.slice()
  out[idx] = { ...tasks[idx], offerQueue: next }
  return out
}

/**
 * 공정표 작업 + 섭외 대기열 단일 SSOT (#576/#582/#575). 그리드·작업 패널·탐색 섭외가 공유한다.
 * 대표 기술자는 offerQueue 의 'offered' 멤버에서 파생(taskAssignee) — 중복 저장/동기화 없음.
 * BE 연동(C) 시 React Query mutation 으로 교체 — 소비처 시그니처 유지.
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
  addOffer: (taskId, item) => {
    set((s) => ({
      tasks: patchQueue(s.tasks, taskId, (cur) =>
        cur.some((q) => q.profileId === item.profileId)
          ? cur
          : [...cur, { ...item, status: 'waiting' }]
      ),
    }))
  },
  removeOffer: (taskId, profileId) => {
    set((s) => ({
      tasks: patchQueue(s.tasks, taskId, (cur) => {
        const next = cur.filter((q) => q.profileId !== profileId)
        return next.length === cur.length ? cur : next
      }),
    }))
  },
  reorderOffer: (taskId, activeProfileId, overProfileId) => {
    set((s) => ({
      tasks: patchQueue(s.tasks, taskId, (cur) => {
        if (activeProfileId === overProfileId) return cur
        const from = cur.findIndex((q) => q.profileId === activeProfileId)
        const to = cur.findIndex((q) => q.profileId === overProfileId)
        if (from < 0 || to < 0) return cur
        if (cur[from].status !== 'waiting' || cur[to].status !== 'waiting') return cur
        const next = cur.slice()
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return next
      }),
    }))
  },
}))
