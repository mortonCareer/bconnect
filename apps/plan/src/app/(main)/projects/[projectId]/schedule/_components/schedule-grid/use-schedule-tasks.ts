'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ScheduleTask } from './types'

/**
 * 공정표 작업 로컬 상태 seam (#576).
 * BE 연동(C) 시 이 훅 내부만 React Query mutation 으로 교체한다 — 호출부 시그니처 유지.
 */
export function useScheduleTasks(initialTasks: ScheduleTask[]) {
  const [rawTasks, setRawTasks] = useState(initialTasks)

  const tasks = useMemo(
    () =>
      [...rawTasks].sort(
        (a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate)
      ),
    [rawTasks]
  )

  const updateTask = useCallback((id: string, patch: Partial<Omit<ScheduleTask, 'id'>>) => {
    setRawTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const createTask = useCallback((task: ScheduleTask) => {
    setRawTasks((prev) => [...prev, task])
  }, [])

  const deleteTask = useCallback((id: string) => {
    setRawTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { tasks, updateTask, createTask, deleteTask }
}
