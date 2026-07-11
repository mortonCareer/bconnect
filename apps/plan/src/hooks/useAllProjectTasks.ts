'use client'

import { useMemo } from 'react'
import { getGetProjectTasksQueryOptions, useGetProjects, useQueries } from '@bconnect/api-client'
import { toScheduleTask } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/task-adapter'
import type { ScheduleTask } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/types'
import { useAuthStore } from '@/stores/auth-store'

/**
 * 전 프로젝트의 작업 flat 목록 (#767) — TaskSelectBar 옵션·useSelectedTask 룩업용.
 * offers 는 조회하지 않으므로 status 는 근사치(섭외중 파생 없음) — 표시 라벨 용도만.
 * 게스트도 마운트되는 경로(TaskSelectBar 등)가 있어 훅 내부에서 로그인 게이트(#802).
 * 호출부 게이트는 불충분 — 같은 queryKey 의 다른 observer 하나만 enabled 면 요청이 나간다.
 */
export function useAllProjectTasks() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: projects, isLoading: isProjectsLoading } = useGetProjects({
    query: { enabled: isAuthenticated },
  })
  const projectIds = useMemo(() => (projects ?? []).flatMap((p) => p.id ?? []), [projects])

  const taskQueries = useQueries({
    queries: projectIds.map((id) => getGetProjectTasksQueryOptions(id)),
  })

  const tasks: ScheduleTask[] = useMemo(
    () => taskQueries.flatMap((q) => (q.data ?? []).map((task) => toScheduleTask(task))),
    [taskQueries]
  )

  const projectTitleById = useMemo(() => {
    const map = new Map<string, string>()
    for (const project of projects ?? []) {
      if (project.id != null) map.set(String(project.id), project.title ?? '')
    }
    return map
  }, [projects])

  return {
    tasks,
    projects: projects ?? [],
    projectTitleById,
    isLoading: isProjectsLoading || taskQueries.some((q) => q.isLoading),
  }
}
