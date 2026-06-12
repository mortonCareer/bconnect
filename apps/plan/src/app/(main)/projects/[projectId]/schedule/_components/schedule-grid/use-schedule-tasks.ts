'use client'

import { useScheduleTaskStore } from '@/stores/schedule-task-store'
import { useMemo } from 'react'

/**
 * 공정표 작업 상태 소비 훅 (#576). 진실원은 schedule-task-store (작업 패널과 공유, #582).
 * 정렬(start asc → end asc)을 렌더 전 여기서 강제한다 — 변경 시마다 자동 재적용.
 */
export function useScheduleTasks() {
  const rawTasks = useScheduleTaskStore((s) => s.tasks)
  const updateTask = useScheduleTaskStore((s) => s.updateTask)
  const createTask = useScheduleTaskStore((s) => s.createTask)
  const deleteTask = useScheduleTaskStore((s) => s.deleteTask)

  const tasks = useMemo(
    () =>
      [...rawTasks].sort(
        (a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate)
      ),
    [rawTasks]
  )

  return { tasks, updateTask, createTask, deleteTask }
}
