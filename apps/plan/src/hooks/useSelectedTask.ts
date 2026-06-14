'use client'

import { parseAsString, useQueryStates } from 'nuqs'
import { useScheduleTaskStore } from '@/stores/schedule-task-store'
import { MOCK_PROJECT } from '@/app/(main)/projects/[projectId]/schedule/_components/mock'

/**
 * 탐색 '선택 모드' — URL `?project=&task=` 가 진실원 (#575 리다이렉트 계약, nuqs).
 * 선택 대상은 프로젝트 + 그 안의 작업(task). task 메타는 schedule-task-store 에서 조회해 라벨 파생.
 * 큐 store 키는 taskId (현재 mock 단일 프로젝트, task→project 유일).
 */
export function useSelectedTask() {
  const [{ task: taskId, project: projectParam }, setParams] = useQueryStates({
    task: parseAsString,
    project: parseAsString,
  })
  const task = useScheduleTaskStore((s) =>
    taskId ? s.tasks.find((t) => t.id === taskId) : undefined
  )
  const label = task ? `${MOCK_PROJECT.name} | ${task.ganttName}` : null
  const projectId = projectParam ?? (taskId ? MOCK_PROJECT.id : null)

  const select = (nextTaskId: string | null) =>
    setParams({ task: nextTaskId, project: nextTaskId ? MOCK_PROJECT.id : null })

  return { projectId, taskId, task, label, select }
}
