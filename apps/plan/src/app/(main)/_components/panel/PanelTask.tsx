/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1879-12536
 */
'use client'

import { usePanelNav } from '@/hooks/usePanelNav'
import { useScheduleTaskStore } from '@/stores/schedule-task-store'
import {
  Button,
  DateRangeField,
  Form,
  FormSubmitButton,
  SearchIcon,
  TagSelectField,
  TextField,
  TextareaField,
} from '@bconnect/ui'
import { PanelAside, PanelScroll, PanelShell } from '@bconnect/features'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { ScheduleTask } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/types'

const TRADE_OPTIONS = [
  '철거',
  '전기',
  '목공',
  '창호',
  '타일',
  '필름',
  '도배',
  '페인트',
  '바닥',
  '방수',
  '싱크대',
  '가구',
  '조명',
].map((v) => ({ value: v, label: v }))

const taskSchema = z
  .object({
    ganttName: z.string().min(1, '작업명을 입력해주세요.'),
    corpName: z.string(),
    startDate: z.string().min(1, '시작일을 선택해주세요.'),
    endDate: z.string().min(1, '종료일을 선택해주세요.'),
    address: z.string(),
    addressDetail: z.string(),
    trades: z.array(z.string()).min(1, '공종을 1개 이상 선택해주세요.'),
    request: z.string(),
    memo: z.string(),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: '종료일은 시작일 이후여야 해요.',
    path: ['endDate'],
  })

type TaskFormValues = z.infer<typeof taskSchema>

const EMPTY_FORM: TaskFormValues = {
  ganttName: '',
  corpName: '',
  startDate: '',
  endDate: '',
  address: '',
  addressDetail: '',
  trades: [],
  request: '',
  memo: '',
}

function toFormValues(task: ScheduleTask): TaskFormValues {
  return {
    ganttName: task.ganttName ?? '',
    corpName: task.corpName ?? '',
    startDate: task.startDate ?? '',
    endDate: task.endDate ?? '',
    address: task.address ?? '',
    addressDetail: task.addressDetail ?? '',
    trades: task.trades ?? [],
    request: task.request ?? '',
    memo: task.memo ?? '',
  }
}

/**
 * 공정표 작업 생성/편집 패널 (#582). `?panel=task/new` = 빈 폼(생성, 명시 '작업 생성'),
 * `?panel=task/{id}` = 채워진 폼(편집, 즉시저장). 저장은 schedule-task-store seam 경유.
 *
 * 편집 모드는 store ↔ 폼 양방향:
 * - store → 폼: `useForm({ values })` 로 외부 변경(간트바 드래그/리사이즈)을 input 에 반영
 * - 폼 → store: useWatch 로 유효한 값만 즉시 updateTask. 외부 반영분과 동일하면 no-op (루프 차단)
 */
export function PanelTask({ taskId }: { taskId?: string }) {
  const { close, closeHref } = usePanelNav()
  const task = useScheduleTaskStore((s) =>
    taskId ? s.tasks.find((t) => t.id === taskId) : undefined
  )
  const createTask = useScheduleTaskStore((s) => s.createTask)
  const updateTask = useScheduleTaskStore((s) => s.updateTask)
  const isEdit = !!taskId

  const values = useMemo(() => (isEdit && task ? toFormValues(task) : undefined), [isEdit, task])

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    mode: 'onChange',
    defaultValues: EMPTY_FORM,
    values,
  })

  // 폼 → store 즉시저장 (편집 모드). 사용자 입력(type==='change')만 반영한다 —
  // store→폼 역방향 sync(useForm values 가 일으키는 reset)까지 되쓰면 드래그값↔폼값이
  // 진동해 무한 루프가 난다. 출처를 구분해 단방향만 흘려보낸다.
  useEffect(() => {
    if (!isEdit || !taskId) return
    const sub = form.watch((value, { type }) => {
      if (type !== 'change') return
      const parsed = taskSchema.safeParse(value)
      if (!parsed.success) return
      updateTask(taskId, { ...parsed.data, category: parsed.data.trades.join(' · ') })
    })
    return () => sub.unsubscribe()
  }, [isEdit, taskId, form, updateTask])

  if (isEdit && !task) {
    return (
      <PanelAside label="작업 편집">
        <PanelShell title="작업 편집" closeHref={closeHref} onClose={close}>
          <p className="px-5 py-10 text-center text-r-14 text-gray-500">작업을 찾을 수 없어요.</p>
        </PanelShell>
      </PanelAside>
    )
  }

  // 생성 모드만 명시 제출 (빈 작업 자동생성 방지). 편집은 즉시저장이라 submit no-op.
  const onSubmit = form.handleSubmit((vals) => {
    if (isEdit) return
    createTask({ ...vals, category: vals.trades.join(' · '), status: 'not_started' })
    close()
  })

  const title = isEdit ? `${(task?.trades ?? []).join('/') || task?.category} 시공` : '작업 생성'

  return (
    <PanelAside label={isEdit ? '작업 편집' : '작업 생성'}>
      <PanelShell title={title} closeHref={closeHref} onClose={close}>
        <PanelScroll>
          <Form {...form}>
            <form onSubmit={onSubmit} className="flex flex-col px-4 pb-6">
              <TextField control={form.control} name="ganttName" label="작업명" layout="row" />
              <TextField control={form.control} name="corpName" label="업체명" layout="row" />
              <DateRangeField
                control={form.control}
                startName="startDate"
                endName="endDate"
                label="작업기간"
                layout="row"
              />
              <TextField control={form.control} name="address" label="현장주소" layout="row" />
              <TextField
                control={form.control}
                name="addressDetail"
                label="상세주소"
                layout="row"
              />
              <TagSelectField
                control={form.control}
                name="trades"
                options={TRADE_OPTIONS}
                label="공종"
                layout="row"
              />
              <TextField control={form.control} name="request" label="요청사항" layout="row" />
              <TextareaField control={form.control} name="memo" label="메모" layout="row" />
              <p className="mt-3 text-r-12 text-gray-500">
                * 작성된 메모는 기술자에게 공개되지 않아요
              </p>
              {/* 편집은 즉시저장(시안에 저장 버튼 없음), 생성만 명시 제출 */}
              {!isEdit && (
                <FormSubmitButton className="mt-5" requireAllFilled={false}>
                  작업 생성
                </FormSubmitButton>
              )}
            </form>
          </Form>

          <div className="mt-2 border-t border-solid border-[#e5e5e5] px-5 py-4">
            <h3 className="text-sb-14 text-gray-900">섭외대기열</h3>
            <div className="flex flex-col items-center pb-4 pt-8">
              <div className="flex size-[140px] items-center justify-center rounded-full bg-secondary">
                <SearchIcon size={72} className="text-primary" />
              </div>
              <p className="mt-4 text-r-14 text-gray-600">기술자를 탐색하고 섭외해보세요</p>
              <Button asChild className="mt-4 w-full">
                <Link href="/">기술자 탐색</Link>
              </Button>
            </div>
          </div>
        </PanelScroll>
      </PanelShell>
    </PanelAside>
  )
}
