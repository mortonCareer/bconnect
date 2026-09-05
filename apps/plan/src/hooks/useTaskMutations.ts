'use client'

import { useRef } from 'react'
import {
  getGetProjectTasksQueryKey,
  useCreateTaskCompany,
  useDeleteTask,
  useQueryClient,
  useUpdateTaskCompany,
} from '@bconnect/api-client'
import type { CompanyTask } from '@bconnect/api-client'
import {
  applyFePatch,
  toCreateRequest,
  toUpdateRequest,
} from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/task-adapter'
import type { TaskFormInput } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/task-adapter'
import type { ScheduleTask } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/types'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'

/**
 * 공정표 작업 mutation 공통 파이프라인 (#767) — 그리드(use-schedule-tasks)와 작업 패널
 * (PanelTask)이 같은 경로를 타야 폼 ↔ 간트바 동기화가 유지된다.
 *
 * update: 캐시 낙관적 patch(즉각 반영) + 500ms debounce 로 풀바디 PUT
 * (UpdateProjectTaskRequest 는 부분 patch 불가). onError 시 invalidate 로 서버 진실 복구.
 */
export function useTaskMutations(projectId: string) {
  const queryClient = useQueryClient()
  const tasksKey = getGetProjectTasksQueryKey(Number(projectId))

  const invalidateTasks = () => queryClient.invalidateQueries({ queryKey: tasksKey })

  const { mutate: mutateUpdate } = useUpdateTaskCompany({
    mutation: {
      onError: () => invalidateTasks(),
    },
  })
  const { mutate: mutateDelete } = useDeleteTask({
    mutation: {
      onError: () => invalidateTasks(),
      onSuccess: () => invalidateTasks(),
    },
  })
  const { mutateAsync: mutateCreate, isPending: isCreating } = useCreateTaskCompany()

  const readTask = (taskId: number): CompanyTask | undefined =>
    queryClient.getQueryData<CompanyTask[]>(tasksKey)?.find((t: CompanyTask) => t.id === taskId)

  // 직전 debounce 대상과 다른 작업을 편집하면 먼저 flush — 단일 타이머로 인한 저장 유실 방지
  const pendingIdRef = useRef<number | null>(null)
  const debouncedSave = useDebouncedCallback((taskId: number) => {
    pendingIdRef.current = null
    const task = readTask(taskId)
    if (task) mutateUpdate({ id: taskId, data: toUpdateRequest(task) })
  }, 500)

  /** FE patch 를 캐시에 즉시 반영 + debounce 저장. draft 는 호출측(draft store)에서 분기. */
  const updateTask = (taskId: number, patch: Partial<Omit<ScheduleTask, 'id'>>) => {
    queryClient.setQueryData<CompanyTask[]>(tasksKey, (old: CompanyTask[] | undefined) =>
      old?.map((t: CompanyTask) => (t.id === taskId ? applyFePatch(t, patch) : t))
    )
    if (pendingIdRef.current != null && pendingIdRef.current !== taskId) debouncedSave.flush()
    pendingIdRef.current = taskId
    debouncedSave(taskId)
  }

  const deleteTask = (taskId: number) => {
    if (pendingIdRef.current === taskId) debouncedSave.cancel()
    queryClient.setQueryData<CompanyTask[]>(tasksKey, (old: CompanyTask[] | undefined) =>
      old?.filter((t: CompanyTask) => t.id !== taskId)
    )
    mutateDelete({ id: taskId })
  }

  /** draft 확정 — 서버 생성 후 목록 재조회. 반환 = 새 task id. */
  const createTask = async (values: TaskFormInput): Promise<number> => {
    const id = await mutateCreate({ data: toCreateRequest(values, projectId) })
    await invalidateTasks()
    return id
  }

  /** 패널 닫기 등에서 대기 중인 debounce 저장을 즉시 발사 */
  const flushPendingSave = () => debouncedSave.flush()

  return { updateTask, deleteTask, createTask, isCreating, flushPendingSave }
}
