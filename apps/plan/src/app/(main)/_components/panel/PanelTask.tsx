/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1879-12536
 */
'use client'

import { usePanelNav } from '@/hooks/usePanelNav'
import { useScheduleTaskStore } from '@/stores/schedule-task-store'
import {
  ConfirmDialog,
  DateRangeField,
  Form,
  FormSubmitButton,
  SearchIcon,
  TagSelectField,
  TextField,
  TextareaField,
} from '@bconnect/ui'
import { PanelAside, PanelScroll, PanelShell } from '@bconnect/features'
import { Trade, TRADE_LABELS, TRADE_LIST } from '@bconnect/api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { ScheduleTask } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/types'
import { MOCK_PROJECT } from '@/app/(main)/projects/[projectId]/schedule/_components/mock'
import { OfferQueue } from '../offer/OfferQueue'

const taskSchema = z
  .object({
    ganttName: z.string().min(1, '작업명을 입력해주세요.'),
    corpName: z.string(),
    startDate: z.string().min(1, '시작일을 선택해주세요.'),
    endDate: z.string().min(1, '종료일을 선택해주세요.'),
    address: z.string(),
    addressDetail: z.string(),
    trades: z.array(z.nativeEnum(Trade)).min(1, '공종을 1개 이상 선택해주세요.'),
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
  const pathname = usePathname()
  // 생성 시 소속 프로젝트 — 공정표 라우트(/projects/{id}/schedule)에서 진입. 없으면 기본 프로젝트.
  const projectId = pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? MOCK_PROJECT.id
  const task = useScheduleTaskStore((s) =>
    taskId ? s.tasks.find((t) => t.id === taskId) : undefined
  )
  const createTask = useScheduleTaskStore((s) => s.createTask)
  const updateTask = useScheduleTaskStore((s) => s.updateTask)
  const deleteTask = useScheduleTaskStore((s) => s.deleteTask)
  const isEdit = !!taskId
  // 드래그-생성 직후 미확정 작업 — 닫기 가드 + 흐린 간트바. 폼 유효 후 확정(draft 해제).
  const isDraft = !!task?.draft
  const [cancelOpen, setCancelOpen] = useState(false)

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
      updateTask(taskId, parsed.data)
    })
    return () => sub.unsubscribe()
  }, [isEdit, taskId, form, updateTask])

  // 닫기 요청 공통 경로(>> 버튼·ESC·backdrop). draft + 미완성이면 가드, 완성이면 확정 후 닫기.
  // 유효성은 RHF isValid 초기 타이밍 의존 대신 safeParse 로 결정적 판정.
  function requestClose() {
    if (isDraft) {
      if (!taskSchema.safeParse(form.getValues()).success) {
        setCancelOpen(true)
        return
      }
      if (taskId) updateTask(taskId, { draft: false })
    }
    close()
  }

  // 브라우저 닫기/새로고침 가드 — draft(미확정) 동안 (네이티브 다이얼로그).
  useEffect(() => {
    if (!isDraft) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDraft])

  if (isEdit && !task) {
    return (
      <PanelAside label="작업 편집">
        <PanelShell title="작업 편집" closeHref={closeHref} onClose={close}>
          <p className="px-5 py-10 text-center text-r-14 text-gray-500">작업을 찾을 수 없어요.</p>
        </PanelShell>
      </PanelAside>
    )
  }

  // draft(드래그-생성) 확정 = draft 해제 + 닫기. 일반 편집은 즉시저장이라 submit no-op. 생성은 createTask.
  const onSubmit = form.handleSubmit((vals) => {
    if (isDraft && taskId) {
      updateTask(taskId, { ...vals, draft: false })
      close()
      return
    }
    if (isEdit) return
    createTask({ ...vals, projectId, status: 'not_started' })
    close()
  })

  const title =
    isEdit && !isDraft
      ? `${(task?.trades ?? []).map((t) => TRADE_LABELS[t]).join('/')} 시공`
      : '작업 생성'

  return (
    <>
      {/* draft 작성 중 인앱 이탈 차단(모달) — 바깥 클릭 시 닫기 가드 */}
      {isDraft && (
        <div className="fixed inset-0 z-30 bg-black/20" onClick={requestClose} aria-hidden="true" />
      )}
      <PanelAside label={isEdit && !isDraft ? '작업 편집' : '작업 생성'}>
        <PanelShell
          title={title}
          closeHref={closeHref}
          onClose={requestClose}
          closeAsButton={isDraft}
        >
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
                  options={TRADE_LIST}
                  label="공종"
                  layout="row"
                />
                <TextField control={form.control} name="request" label="요청사항" layout="row" />
                <TextareaField control={form.control} name="memo" label="메모" layout="row" />
                <p className="mt-3 text-r-12 text-gray-500">
                  * 작성된 메모는 기술자에게 공개되지 않아요
                </p>
                {/* 일반 편집은 즉시저장(버튼 없음). 생성·draft 확정만 명시 제출. */}
                {(!isEdit || isDraft) && (
                  <FormSubmitButton className="mt-5" requireAllFilled={false}>
                    작업 생성
                  </FormSubmitButton>
                )}
              </form>
            </Form>

            <div className="mt-2 border-t border-solid border-[#e5e5e5] px-5 py-4">
              <h3 className="text-sb-14 text-gray-900">섭외대기열</h3>
              {isEdit && taskId ? (
                <OfferQueue
                  taskId={taskId}
                  emptyActionHref={`/?task=${taskId}&trade=${(task?.trades ?? []).join(',')}`}
                />
              ) : (
                <div className="flex flex-col items-center pb-4 pt-8">
                  <div className="flex size-[140px] items-center justify-center rounded-full bg-secondary">
                    <SearchIcon size={72} className="text-primary" />
                  </div>
                  <p className="text-r-14 mt-4 text-gray-600">작업을 먼저 생성해주세요</p>
                </div>
              )}
            </div>
          </PanelScroll>
        </PanelShell>
      </PanelAside>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="작업 생성을 취소할까요?"
        description="작성 중인 작업이 사라져요."
        confirmLabel="취소하기"
        destructive
        onConfirm={() => {
          if (taskId) deleteTask(taskId)
          setCancelOpen(false)
          close()
        }}
      />
    </>
  )
}
