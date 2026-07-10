'use client'

import { useMemo } from 'react'
import {
  getGetProfileQueryOptions,
  getGetTaskOffersQueryOptions,
  TaskStatus as BeTaskStatus,
  useGetProjectTasks,
  useQueries,
} from '@bconnect/api-client'
import type { Offer, Profile } from '@bconnect/api-client'
import { useDraftTaskStore } from '@/stores/draft-task-store'
import { useTaskMutations } from '@/hooks/useTaskMutations'
import { DRAFT_TASK_ID, toNumericTaskId, toScheduleTask } from './task-adapter'
import type { ScheduleTask } from './types'

/**
 * 공정표 작업 상태 소비 훅 (#576→#767). 서버 상태 SSOT = React Query 캐시.
 * - 섭외 진행(DRAFT/OPEN/OFFERED) 작업은 offers 를 붙여 '섭외중'·대표 기술자 파생
 * - 섭외 확정(workerId 보유) 작업은 프로필 조회로 대표 기술자 파생
 *   (BE getTaskOffers 가 ACCEPTED 를 반환하지 않아 workerId 경유가 유일한 경로)
 * - 드래그-생성 draft(로컬)를 병합하고 정렬(start asc → end asc)을 렌더 전 강제
 * 소비처 시그니처는 store 시절과 동일 유지 (string id 의 update/create/delete).
 */
export function useScheduleTasks(projectId: string) {
  const { data: beTasks } = useGetProjectTasks(Number(projectId))
  const draft = useDraftTaskStore((s) => s.draft)
  const startDraft = useDraftTaskStore((s) => s.startDraft)
  const patchDraft = useDraftTaskStore((s) => s.patchDraft)
  const clearDraft = useDraftTaskStore((s) => s.clearDraft)
  const mutations = useTaskMutations(projectId)

  const offerTaskIds = useMemo(
    () =>
      (beTasks ?? []).flatMap((t) =>
        t.id != null &&
        (t.status === BeTaskStatus.DRAFT ||
          t.status === BeTaskStatus.OPEN ||
          t.status === BeTaskStatus.OFFERED)
          ? t.id
          : []
      ),
    [beTasks]
  )
  const offerQueries = useQueries({
    queries: offerTaskIds.map((id) => getGetTaskOffersQueryOptions(id)),
  })
  const offersByTask = useMemo(() => {
    const map = new Map<number, Offer[]>()
    offerQueries.forEach((q, i) => {
      if (q.data) map.set(offerTaskIds[i], q.data)
    })
    return map
  }, [offerQueries, offerTaskIds])

  const workerIds = useMemo(
    () => [...new Set((beTasks ?? []).flatMap((t) => t.workerId ?? []))],
    [beTasks]
  )
  const profileQueries = useQueries({
    queries: workerIds.map((id) => getGetProfileQueryOptions(id)),
  })
  const profileByWorker = useMemo(() => {
    const map = new Map<number, Profile>()
    profileQueries.forEach((q, i) => {
      if (q.data) map.set(workerIds[i], q.data)
    })
    return map
  }, [profileQueries, workerIds])

  const tasks = useMemo(() => {
    const mapped = (beTasks ?? []).map((t) =>
      toScheduleTask(
        t,
        t.id != null ? offersByTask.get(t.id) : undefined,
        t.workerId != null ? profileByWorker.get(t.workerId) : undefined
      )
    )
    const merged = draft && draft.projectId === projectId ? [...mapped, draft] : mapped
    return merged.sort(
      (a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate)
    )
  }, [beTasks, offersByTask, profileByWorker, draft, projectId])

  const updateTask = (id: string, patch: Partial<Omit<ScheduleTask, 'id'>>) => {
    if (id === DRAFT_TASK_ID) {
      patchDraft(patch)
      return
    }
    const numId = toNumericTaskId(id)
    if (numId != null) mutations.updateTask(numId, patch)
  }

  /** 드래그-생성 → 로컬 draft 시작 (서버 생성은 폼 확정 시점 — PanelTask). */
  const createTask = (input: Omit<ScheduleTask, 'id'>): string => {
    startDraft(input)
    return DRAFT_TASK_ID
  }

  const deleteTask = (id: string) => {
    if (id === DRAFT_TASK_ID) {
      clearDraft()
      return
    }
    const numId = toNumericTaskId(id)
    if (numId != null) mutations.deleteTask(numId)
  }

  return { tasks, updateTask, createTask, deleteTask }
}
