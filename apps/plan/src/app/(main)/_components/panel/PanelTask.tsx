/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1879-12536
 */
'use client'

import { usePanelNav } from '@/hooks/usePanelNav'
import { useAllProjectTasks } from '@/hooks/useAllProjectTasks'
import { useTaskMutations } from '@/hooks/useTaskMutations'
import { useDraftTaskStore } from '@/stores/draft-task-store'
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
import { DRAFT_TASK_ID } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/task-adapter'
import type { ScheduleTask } from '@/app/(main)/projects/[projectId]/schedule/_components/schedule-grid/types'
import { OfferQueue } from '../offer/OfferQueue'

const taskSchema = z
  .object({
    ganttName: z.string().min(1, '작업명을 입력해주세요.'),
    // 업체명/주소는 BE 저장 필드 없음 — 읽기전용 표시 (주소는 프로젝트 주소가 BE 에서 주입됨)
    corpName: z.string(),
    startDate: z.string().min(1, '시작일을 선택해주세요.'),
    endDate: z.string().min(1, '종료일을 선택해주세요.'),
    address: z.string(),
    addressDetail: z.string(),
    trades: z.array(z.nativeEnum(Trade)).min(1, '공종을 1개 이상 선택해주세요.'),
    // BE CreateProjectTaskRequest 가 requirement/memo minLength 1 필수 — 폼도 필수
    request: z.string().min(1, '요청사항을 입력해주세요.'),
    memo: z.string().min(1, '메모를 입력해주세요.'),
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
 * 공정표 작업 생성/편집 패널 (#582→#767). `?panel=task/new` = 빈 폼(생성),
 * `?panel=task/draft` = 드래그-생성 로컬 draft, `?panel=task/{id}` = 편집(즉시저장).
 *
 * 서버 작업은 React Query 캐시가 SSOT — 즉시저장은 useTaskMutations 파이프라인
 * (낙관적 캐시 patch + 500ms debounce PUT). draft 는 로컬 store 만 갱신하다가
 * 폼 유효 확정 시 createTaskCompany 로 서버 생성.
 */
export function PanelTask({ taskId }: { taskId?: string }) {
  const { close, closeHref } = usePanelNav()
  const pathname = usePathname()
  const draft = useDraftTaskStore((s) => s.draft)
  const patchDraft = useDraftTaskStore((s) => s.patchDraft)
  const clearDraft = useDraftTaskStore((s) => s.clearDraft)
  const { tasks: allTasks, projects, isLoading: isTasksLoading } = useAllProjectTasks()

  const isDraft = taskId === DRAFT_TASK_ID
  const isEdit = !!taskId
  const task = isDraft ? (draft ?? undefined) : allTasks.find((t) => t.id === taskId)

  // 소속 프로젝트 — 편집은 task 유래, 생성은 공정표 라우트(/projects/{id}/schedule) 유래.
  // 라우트 밖 진입이면 첫 프로젝트 폴백.
  const projectId =
    task?.projectId ?? pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? String(projects[0]?.id ?? '')
  const { updateTask, deleteTask, createTask, isCreating, flushPendingSave } =
    useTaskMutations(projectId)

  const [cancelOpen, setCancelOpen] = useState(false)

  const values = useMemo(() => (isEdit && task ? toFormValues(task) : undefined), [isEdit, task])

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    mode: 'onChange',
    defaultValues: EMPTY_FORM,
    values,
  })

  // 폼 → 즉시저장 (편집 모드). 사용자 입력(type==='change')만 반영 —
  // 캐시→폼 역방향 sync(useForm values 발 reset)까지 되쓰면 드래그값↔폼값이 진동한다.
  // draft 는 로컬 patch, 서버 작업은 낙관적 patch + debounce PUT.
  useEffect(() => {
    if (!isEdit || !taskId) return
    const sub = form.watch((value, { type }) => {
      if (type !== 'change') return
      const parsed = taskSchema.safeParse(value)
      if (!parsed.success) return
      if (isDraft) patchDraft(parsed.data)
      else updateTask(Number(taskId), parsed.data)
    })
    return () => sub.unsubscribe()
  }, [isEdit, isDraft, taskId, form, updateTask, patchDraft])

  // draft 확정 = 서버 생성 → 로컬 draft 정리 → 닫기
  async function confirmDraft(vals: TaskFormValues) {
    await createTask(vals)
    clearDraft()
    close()
  }

  // 닫기 요청 공통 경로(>> 버튼·ESC·backdrop). draft + 미완성이면 가드, 완성이면 확정 후 닫기.
  function requestClose() {
    if (isDraft) {
      const parsed = taskSchema.safeParse(form.getValues())
      if (!parsed.success) {
        setCancelOpen(true)
        return
      }
      if (!isCreating) void confirmDraft(parsed.data)
      return
    }
    // 편집 즉시저장 debounce 대기분 유실 방지
    flushPendingSave()
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
          <p className="px-5 py-10 text-center text-r-14 text-gray-500">
            {isTasksLoading ? '작업을 불러오는 중이에요.' : '작업을 찾을 수 없어요.'}
          </p>
        </PanelShell>
      </PanelAside>
    )
  }

  // draft(드래그-생성) 확정·명시 생성 = 서버 생성 후 닫기. 일반 편집은 즉시저장이라 submit no-op.
  const onSubmit = form.handleSubmit(async (vals) => {
    if (isDraft) {
      await confirmDraft(vals)
      return
    }
    if (isEdit) return
    await createTask(vals)
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
                <TextField
                  control={form.control}
                  name="corpName"
                  label="업체명"
                  layout="row"
                  disabled
                />
                <DateRangeField
                  control={form.control}
                  startName="startDate"
                  endName="endDate"
                  label="작업기간"
                  layout="row"
                />
                <TextField
                  control={form.control}
                  name="address"
                  label="현장주소"
                  layout="row"
                  disabled
                />
                <TextField
                  control={form.control}
                  name="addressDetail"
                  label="상세주소"
                  layout="row"
                  disabled
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
                  <FormSubmitButton className="mt-5">작업 생성</FormSubmitButton>
                )}
              </form>
            </Form>

            <div className="mt-2 border-t border-solid border-[#e5e5e5] px-5 py-4">
              <h3 className="text-sb-14 text-gray-900">섭외대기열</h3>
              {isEdit && taskId && !isDraft ? (
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
        confirmLabel="생성 취소"
        destructive
        onConfirm={() => {
          if (isDraft) clearDraft()
          else if (taskId) deleteTask(Number(taskId))
          setCancelOpen(false)
          close()
        }}
      />
    </>
  )
}
