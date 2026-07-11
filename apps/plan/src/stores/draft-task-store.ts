import { create } from 'zustand'
import { DRAFT_TASK_ID } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/task-adapter'
import type { ScheduleTask } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/types'

/**
 * 드래그-생성 직후 미확정 작업(draft) 1건의 로컬 상태 (#767).
 * BE create 가 title/requirement/memo 를 필수로 요구해 빈 draft 는 서버에 만들 수 없다 —
 * 폼이 유효해지는 확정 시점에 createTaskCompany 로 서버 생성 후 clear.
 * 서버 작업 상태의 SSOT 는 React Query 캐시 — 이 store 는 draft 전용.
 */
interface DraftTaskState {
  draft: ScheduleTask | null
  startDraft: (input: Omit<ScheduleTask, 'id'>) => void
  patchDraft: (patch: Partial<Omit<ScheduleTask, 'id'>>) => void
  clearDraft: () => void
}

export const useDraftTaskStore = create<DraftTaskState>()((set) => ({
  draft: null,
  startDraft: (input) => set({ draft: { ...input, id: DRAFT_TASK_ID, draft: true } }),
  patchDraft: (patch) => set((s) => (s.draft ? { draft: { ...s.draft, ...patch } } : s)),
  clearDraft: () => set({ draft: null }),
}))
