'use client'

import {
  Trade,
  TRADE_LABELS,
  TRADE_LIST,
  useDeleteTask,
  useUpdateTaskWorker,
} from '@bconnect/api-client'
import type { Address } from '@bconnect/api-client'
import {
  ConfirmDialog,
  DateRangeField,
  FilterChip,
  Form,
  MoreVerticalIcon,
  TagSelectField,
  TextField,
  TextareaField,
  cn,
  isApiErrorShape,
  toast,
} from '@bconnect/ui'
import { formatPeriod } from '@bconnect/config/format'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AddressField } from '@/components/AddressField'
import { useShareCurrentUrl } from '@/hooks/useShareCurrentUrl'
import type { CalendarTask } from '../calendar/types'
import { TaskActionDrawer } from './TaskActionDrawer'

const REQUIRED_ADDRESS_MESSAGE = '현장주소를 입력해주세요.'

const editSchema = z
  .object({
    company: z.string().min(1, '업체명을 입력해주세요.'),
    start: z.string().min(1, '시작일을 선택해주세요.'),
    end: z.string().min(1, '종료일을 선택해주세요.'),
    address: z.custom<Address | undefined>(
      (v) => v === undefined || (v !== null && typeof v === 'object'),
      REQUIRED_ADDRESS_MESSAGE
    ),
    trades: z.array(z.nativeEnum(Trade)).min(1, '공종을 1개 이상 선택해주세요.'),
    memo: z.string(),
  })
  .superRefine((v, ctx) => {
    if (!v.address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: REQUIRED_ADDRESS_MESSAGE,
        path: ['address'],
      })
    }

    if (v.start > v.end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '종료일은 시작일 이후여야 해요.',
        path: ['end'],
      })
    }
  })

type EditValues = z.infer<typeof editSchema>

function toEditValues(task: CalendarTask): EditValues {
  return {
    company: task.company ?? '',
    start: task.start,
    end: task.end,
    address: task.address,
    trades: task.trades,
    memo: task.memo,
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

interface TaskDetailCardProps {
  task: CalendarTask
  selectedDay: string
  selectedMonth: string
}

export function TaskDetailCard({ task, selectedDay, selectedMonth }: TaskDetailCardProps) {
  const getShareUrl = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('day', selectedDay)
    url.searchParams.set('month', selectedMonth)
    return url.href
  }, [selectedDay, selectedMonth])
  const share = useShareCurrentUrl({ getUrl: getShareUrl })
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    mode: 'onTouched',
    defaultValues: toEditValues(task),
  })

  const onError = (error: unknown) =>
    toast({
      description: isApiErrorShape(error) ? error.message : '다시 시도해주세요',
      variant: 'error',
    })

  const { mutate: update, isPending: saving } = useUpdateTaskWorker({
    mutation: {
      onSuccess: () => {
        toast({ description: '수정되었어요', variant: 'success' })
        setMode('view')
      },
      onError,
    },
  })

  const { mutate: remove } = useDeleteTask({
    mutation: {
      onSuccess: () => {
        toast({ description: '삭제되었어요', variant: 'success' })
      },
      onError,
    },
  })

  const onSubmit = form.handleSubmit((vals) => {
    const address = vals.address

    // BE 계약상 address는 optional이므로 UI required 처리 후 전송 직전에 type narrowing 한다.
    if (!address) {
      form.setError('address', { message: REQUIRED_ADDRESS_MESSAGE })
      return
    }

    update({
      id: task.id,
      data: {
        title: task.title,
        // TODO: BE required 처리 후 type narrowing 필요. workerMemo가 optional emit이라 빈 입력 시 기존 메모/제목으로 silent fallback 중.
        memo: vals.memo.trim() || task.memo || task.title,
        company: vals.company,
        address,
        trades: vals.trades,
        start: vals.start,
        end: vals.end,
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
              className="flex size-6 cursor-pointer items-center justify-center text-gray-500 transition-opacity hover:opacity-60"
              aria-label="작업 메뉴"
            >
              <MoreVerticalIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className={cn(
                'text-sb-16 transition-opacity',
                saving
                  ? 'cursor-default text-gray-400'
                  : 'cursor-pointer text-primary hover:opacity-60'
              )}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </div>

      {mode === 'view' ? (
        <div className="mt-3">
          <Row label="업체명">{task.company || '업체명 없음'}</Row>
          <Row label="작업기간">{formatPeriod(task.start, task.end)}</Row>
          <Row label="현장주소">
            {task.address ? (
              <>
                {task.address.street}
                {task.address.detail ? ` ${task.address.detail}` : ''}
              </>
            ) : (
              '주소 없음'
            )}
          </Row>
          <Row label="공종">
            <span className="flex flex-wrap gap-1.5">
              {task.trades.map((t) => (
                <FilterChip key={t} label={TRADE_LABELS[t]} />
              ))}
            </span>
          </Row>
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
            <AddressField control={form.control} name="address" label="현장주소" layout="row" />
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
        canEdit={task.canManage}
        canDelete={task.canManage}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="작업을 삭제할까요?"
        description="삭제한 작업은 복구할 수 없어요."
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          remove({ id: task.id })
          setConfirmOpen(false)
        }}
      />
    </div>
  )
}
