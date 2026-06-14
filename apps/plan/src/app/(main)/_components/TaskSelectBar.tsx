'use client'

import Link from 'next/link'
import { Select, cn } from '@bconnect/ui'
import { useAuthStore } from '@/stores/auth-store'
import { useScheduleTaskStore } from '@/stores/schedule-task-store'
import { usePanelNav } from '@/hooks/usePanelNav'
import { useSelectedTask } from '@/hooks/useSelectedTask'
import { useOfferQueue } from '@/hooks/useOfferQueue'
import { MOCK_PROJECT } from '@/app/(main)/projects/[projectId]/schedule/_components/mock'

/**
 * 탐색 '선택 모드' 바 (#575) — 프로젝트+작업 선택 셀렉트 + 섭외 대기열 칩.
 * 선택은 useSelectedTask(URL `?project=&task=`), 큐 수는 useOfferQueue facade. 인증 사용자 전용.
 */
export function TaskSelectBar() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const tasks = useScheduleTaskStore((s) => s.tasks)
  const { taskId, select } = useSelectedTask()
  const { panelHref } = usePanelNav()
  const { count } = useOfferQueue(taskId)

  if (!isAuthenticated) return null

  const options = tasks.map((t) => ({
    value: t.id,
    label: `${MOCK_PROJECT.name} | ${t.ganttName}`,
  }))

  return (
    <div className="flex items-center gap-2">
      <Select
        clearable
        fitContent
        placeholder="프로젝트 · 작업 선택"
        value={taskId ?? ''}
        onChange={(v) => select(typeof v === 'string' && v ? v : null)}
        options={options}
      />
      {taskId && (
        <Link
          href={panelHref(`task/${taskId}`)}
          scroll={false}
          className={cn(
            'text-m-14 inline-flex h-10 shrink-0 items-center rounded-lg border border-primary bg-secondary px-3.5 font-semibold text-primary'
          )}
        >
          섭외 대기열 ({count})
        </Link>
      )}
    </div>
  )
}
