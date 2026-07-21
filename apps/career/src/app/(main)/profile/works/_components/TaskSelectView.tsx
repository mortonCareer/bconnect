/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=3417-12416
 */
'use client'

import type { Task } from '@bconnect/api-client'
import { matchHangul } from '@bconnect/config/search'
import { cn, PlusIcon, SearchIcon, TopBar } from '@bconnect/ui'
import { useMemo, useState } from 'react'
import { dotColor } from '@/lib/task-colors'
import { formatWorkPeriod } from './work-utils'

interface TaskSelectViewProps {
  tasks: Task[]
  isLoading?: boolean
  selectedId: number | null
  onConfirm: (taskId: number) => void
  onCreateNew: () => void
  onBack: () => void
}

export function TaskSelectView({
  tasks,
  isLoading,
  selectedId,
  onConfirm,
  onCreateNew,
  onBack,
}: TaskSelectViewProps) {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<number | null>(selectedId)

  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) return tasks
    return tasks.filter(
      (t) => matchHangul(t.workerTitle ?? '', q) || matchHangul(t.workerCompany ?? '', q)
    )
  }, [tasks, query])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopBar
        variant="default"
        title="작업 선택"
        actionLabel="저장"
        actionDisabled={picked == null}
        onAction={() => picked != null && onConfirm(picked)}
        showAction
        onBack={onBack}
      />

      <div className="px-5 py-4">
        <div className="flex h-11 items-center gap-2 rounded-lg bg-gray-100 px-3">
          <SearchIcon size={24} className="text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="작업 검색..."
            aria-label="작업 검색"
            className="min-w-0 flex-1 bg-transparent text-r-14 text-gray-900 outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="flex flex-col px-5">
        {isLoading ? (
          <p className="py-8 text-center text-r-14 text-gray-500">작업을 불러오는 중...</p>
        ) : (
          <>
            {filtered.length === 0 && (
              <p className="py-8 text-center text-r-14 text-gray-500">
                {query ? '검색 결과가 없어요' : '아직 등록된 작업이 없어요'}
              </p>
            )}
            {filtered.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => setPicked(task.id)}
                aria-pressed={picked === task.id}
                className="flex w-full cursor-pointer flex-col items-start gap-2 border-b border-gray-200 px-2 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden className={cn('size-2 rounded-full', dotColor(task.id))} />
                  <span
                    className={cn(
                      'text-m-14',
                      picked === task.id ? 'text-primary' : 'text-gray-900'
                    )}
                  >
                    {task.workerTitle ?? '제목 없음'}
                  </span>
                </span>
                <span className="text-r-14 text-gray-400">
                  {formatWorkPeriod(task.start, task.end)}
                  {task.workerCompany ? ` | ${task.workerCompany}` : ''}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={onCreateNew}
              className="flex w-full cursor-pointer items-center gap-2 px-2 py-4 text-left text-m-14 text-gray-500 transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              <PlusIcon size={16} />새 작업 만들기
            </button>
          </>
        )}
      </div>
    </div>
  )
}
