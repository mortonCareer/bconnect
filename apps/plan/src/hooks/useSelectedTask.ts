'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { useAllProjectTasks } from '@/hooks/useAllProjectTasks'

/**
 * 탐색 '선택 모드' — URL `?task=` 가 진실원 (nuqs). 선택 대상은 작업(task)이고,
 * 소속 프로젝트는 task.projectId 에서 파생(멀티 프로젝트). #575 리다이렉트도 ?task= 로 컨텍스트 전달.
 */
export function useSelectedTask() {
  const [taskId, setTaskId] = useQueryState('task', parseAsString)
  const { tasks, projectTitleById } = useAllProjectTasks()
  const task = taskId ? tasks.find((t) => t.id === taskId) : undefined
  const projectTitle = task ? projectTitleById.get(task.projectId) : undefined
  const label = task ? `${projectTitle ?? '프로젝트'} | ${task.ganttName}` : null

  return {
    taskId,
    task,
    projectId: task?.projectId ?? null,
    label,
    select: (nextTaskId: string | null) => setTaskId(nextTaskId),
  }
}
