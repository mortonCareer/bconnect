'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuthHint } from '@bconnect/api-client'
import { Select, cn } from '@bconnect/ui'
import { usePanelNav } from '@/hooks/usePanelNav'
import { useSelectedTask } from '@/hooks/useSelectedTask'
import { useOfferQueue } from '@/hooks/useOfferQueue'
import { useAllProjectTasks } from '@/hooks/useAllProjectTasks'

/**
 * 탐색 '선택 모드' 바 (#575) — 프로젝트+작업 선택 셀렉트 + 섭외 대기열 칩.
 * 선택은 useSelectedTask(URL `?project=&task=`), 큐 수는 useOfferQueue facade. 인증 사용자 전용.
 */
export function TaskSelectBar() {
  const isAuthenticated = useAuthHint()
  const { tasks, projectTitleById } = useAllProjectTasks()
  const { taskId, select } = useSelectedTask()
  const { panelHref, closeHref } = usePanelNav()
  const { count } = useOfferQueue(taskId)
  const isQueueOpen = useSearchParams().get('panel') === `task/${taskId}`

  if (!isAuthenticated) return null

  const options = tasks.map((t) => ({
    value: t.id,
    label: `${projectTitleById.get(t.projectId) ?? '프로젝트'} | ${t.ganttName}`,
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
          href={isQueueOpen ? closeHref : panelHref(`task/${taskId}`)}
          scroll={false}
          className={cn(
            'text-m-14 inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border px-3.5 font-semibold',
            isQueueOpen
              ? 'border-primary bg-secondary text-primary'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          )}
        >
          섭외 대기열
          <span className="text-primary">({count})</span>
        </Link>
      )}
    </div>
  )
}
