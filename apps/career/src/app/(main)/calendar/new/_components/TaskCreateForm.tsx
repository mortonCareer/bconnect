'use client'

import { TRADE_LIST, useCreateTaskWorker } from '@bconnect/api-client'
import { monthStartOf } from '@bconnect/config/date'
import {
  DateRangeField,
  Form,
  FormError,
  TagSelectField,
  TextField,
  TextareaField,
  TopBar,
  passthroughError,
  toast,
  useScrollToError,
  useServerError,
} from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { AddressField } from '@/components/AddressField'
import { createTaskSchema, type CreateTaskValues } from './schema'

export function TaskCreateForm() {
  const router = useRouter()

  const form = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    mode: 'onTouched',
    defaultValues: {
      title: '',
      company: '',
      start: '',
      end: '',
      address: undefined,
      trades: [],
      request: '',
      memo: '',
    },
  })
  const { control, handleSubmit } = form
  const scrollToError = useScrollToError()
  const server = useServerError(
    control,
    passthroughError<CreateTaskValues>(undefined, '작업 생성에 실패했어요. 다시 시도해주세요.')
  )
  const { mutate, isPending } = useCreateTaskWorker()

  const onSubmit = (data: CreateTaskValues) => {
    mutate(
      {
        data: {
          title: data.title,
          // memo/request는 UI optional이라 BE memo required 전송값을 title로 silent fallback한다.
          memo: data.memo.trim() || data.request.trim() || data.title,
          company: data.company,
          address: data.address,
          trades: data.trades,
          start: data.start,
          end: data.end,
        },
      },
      {
        onSuccess: () => {
          toast({ description: '작업이 생성되었어요', variant: 'success' })
          // 생성한 작업의 시작일로 포커스 (월·선택일 동기화)
          router.replace(`/calendar?day=${data.start}&month=${monthStartOf(data.start)}`)
        },
        onError: (err) => server.capture(err, data),
      }
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopBar
        variant="default"
        title="작업 생성"
        actionLabel={isPending ? '저장 중...' : '완료'}
        actionDisabled={isPending}
        onAction={handleSubmit(onSubmit, scrollToError)}
        onBack={() => router.back()}
      />
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit, scrollToError)} className="flex flex-col px-4 pb-10">
          <TextField
            control={control}
            name="title"
            label="제목"
            layout="row"
            placeholder="제목을 입력해주세요"
          />
          <TextField control={control} name="company" label="업체명" layout="row" />
          <DateRangeField
            control={control}
            startName="start"
            endName="end"
            label="작업기간"
            layout="row"
          />
          <AddressField control={control} name="address" label="현장주소" layout="row" />
          <TagSelectField
            control={control}
            name="trades"
            options={TRADE_LIST}
            label="공종"
            layout="row"
          />
          <TextField control={control} name="request" label="요청사항" layout="row" />
          <TextareaField control={control} name="memo" label="메모" layout="row" />
          <p className="mt-3 text-r-12 text-gray-500">* 작성된 메모는 나만 볼 수 있어요.</p>
          <FormError error={server.formError} />
        </form>
      </Form>
    </div>
  )
}
