'use client'

import {
  getGetMyTasksQueryKey,
  Trade,
  TRADE_LABELS,
  TRADE_LIST,
  useDeleteTask,
  useQueryClient,
  useUpdateTask,
} from '@bconnect/api-client'
import type { Address, Task } from '@bconnect/api-client'
import {
  ConfirmDialog,
  DateRangeField,
  Form,
  MoreVerticalIcon,
  Tag,
  TagSelectField,
  TextField,
  TextareaField,
  cn,
  isApiErrorShape,
  toast,
} from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AddressField } from '@/components/AddressField'
import { useShareCurrentUrl } from '@/hooks/useShareCurrentUrl'
import { formatPeriod } from '../calendar/date-helpers'
import type { CalendarTask } from '../calendar/types'
import { TaskActionDrawer } from './TaskActionDrawer'

const editSchema = z
  .object({
    company: z.string().min(1, '업체명을 입력해주세요.'),
    start: z.string().min(1, '시작일을 선택해주세요.'),
    end: z.string().min(1, '종료일을 선택해주세요.'),
    address: z.custom<Address>((v) => !!v && typeof v === 'object', '현장주소를 입력해주세요.'),
    trades: z.array(z.nativeEnum(Trade)).min(1, '공종을 1개 이상 선택해주세요.'),
    memo: z.string(),
  })
  .refine((v) => v.start <= v.end, { message: '종료일은 시작일 이후여야 해요.', path: ['end'] })

type EditValues = z.infer<typeof editSchema>

function toEditValues(task: Task): EditValues {
  return {
    company: task.company,
    start: task.start,
    end: task.end,
    address: task.address,
    trades: task.trades,
    memo: '', // API 에 memo 필드 없음 (갭2) — 로컬 전용
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2">
      <span className="w-16 shrink-0 text-m-14 text-gray-400">{label}</span>
      <span className="text-m-14 text-gray-900">{children}</span>
    </div>
  )
}

export function TaskDetailCard({ task }: { task: CalendarTask }) {
  const queryClient = useQueryClient()
  const share = useShareCurrentUrl()
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    mode: 'onTouched',
    defaultValues: toEditValues(task.raw),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetMyTasksQueryKey() })

  const onError = (error: unknown) =>
    toast({
      description: isApiErrorShape(error) ? error.message : '다시 시도해주세요',
      variant: 'error',
    })

  const { mutate: update, isPending: saving } = useUpdateTask({
    mutation: {
      onSuccess: () => {
        invalidate()
        toast({ description: '수정되었어요', variant: 'success' })
        setMode('view')
      },
      onError,
    },
  })

  const { mutate: remove } = useDeleteTask({
    mutation: {
      onSuccess: () => {
        invalidate()
        toast({ description: '삭제되었어요', variant: 'success' })
      },
      onError,
    },
  })

  const onSubmit = form.handleSubmit((vals) => {
    update({
      taskId: task.id,
      data: {
        company: vals.company,
        address: vals.address,
        trades: vals.trades,
        start: vals.start,
        end: vals.end,
        // 인라인 수정 미노출 required 필드는 기존값 재전송 (갭4)
        taskTitle: task.raw.taskTitle,
        eventTitle: task.raw.eventTitle,
      },
    })
  })

  return (
    <div className="px-4 pb-6 pt-5">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sb-16 text-gray-900">{task.title}</h2>
        <div className="flex shrink-0 items-center gap-2">
          {task.isProposed && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-r-12 text-gray-500">
              제안됨
            </span>
          )}
          {mode === 'view' ? (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex size-6 items-center justify-center text-gray-500 hover:opacity-60"
              aria-label="작업 메뉴"
            >
              <MoreVerticalIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className={cn('text-sb-16', saving ? 'text-gray-400' : 'text-primary')}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </div>

      {mode === 'view' ? (
        <div className="mt-3">
          <Row label="업체명">{task.raw.company}</Row>
          <Row label="작업기간">{formatPeriod(task.start, task.end)}</Row>
          <Row label="현장주소">
            {task.raw.address.street}
            {task.raw.address.detail ? ` ${task.raw.address.detail}` : ''}
          </Row>
          <Row label="공종">
            <span className="flex flex-wrap gap-1.5">
              {task.raw.trades.map((t) => (
                <Tag key={t}>{TRADE_LABELS[t]}</Tag>
              ))}
            </span>
          </Row>
          {task.raw.taskTitle && <Row label="메모">{task.raw.taskTitle}</Row>}
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={onSubmit} className="mt-2 flex flex-col">
            <TextField control={form.control} name="company" label="업체명" layout="row" />
            <DateRangeField
              control={form.control}
              startName="start"
              endName="end"
              label="작업기간"
              layout="row"
            />
            <AddressField control={form.control} name="address" label="현장주소" />
            <TagSelectField
              control={form.control}
              name="trades"
              options={TRADE_LIST}
              label="공종"
              layout="row"
            />
            <TextareaField control={form.control} name="memo" label="메모" layout="row" />
          </form>
        </Form>
      )}

      <TaskActionDrawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onShare={share}
        onEdit={() => setMode('edit')}
        onDelete={() => setConfirmOpen(true)}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="작업을 삭제할까요?"
        description="삭제한 작업은 복구할 수 없어요."
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          remove({ taskId: task.id })
          setConfirmOpen(false)
        }}
      />
    </div>
  )
}
