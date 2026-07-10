/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1239-7490
 */
'use client'

import { useGetFeed, useGetTasks, useUpdatePost } from '@bconnect/api-client'
import { Form, isApiErrorShape, TextareaField, toast, TopBar } from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { WorkPostForm, type WorkPostMeta } from '../_components/WorkPostForm'

const editSchema = z.object({
  content: z.string().min(1, '작업 설명을 입력해주세요.'),
})
type EditValues = z.infer<typeof editSchema>

/** 수정 화면에서 기존 이미지(S3 URL)는 표시전용 — private CloudFront라 plain <img> 사용 (CLAUDE-FE 규칙). */
function ReadonlyImages({ images }: { images: string[] }) {
  if (images.length === 0) {
    return (
      <div className="flex h-50 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
        이미지 없음
      </div>
    )
  }
  return (
    <div className="flex gap-2 overflow-x-auto">
      {images.map((src) => (
        <img key={src} src={src} alt="" className="h-50 w-50 shrink-0 rounded-lg object-cover" />
      ))}
    </div>
  )
}

export default function EditWorkPage() {
  const router = useRouter()
  const params = useParams<{ postId: string }>()
  const postId = Number(params.postId)

  const { data: feed, isLoading, isError } = useGetFeed(postId)
  const post = feed?.post

  // 읽기전용 메타는 post.taskId 로 연결된 작업에서 온다. 단건 조회 훅이 없어 worker 작업 목록에서 find.
  const { data: tasks } = useGetTasks()
  const task = tasks?.find((t) => t.id === post?.taskId)
  const meta: WorkPostMeta | null =
    task && task.start && task.end
      ? {
          company: task.workerCompany,
          start: task.start,
          end: task.end,
          address: task.address,
          trades: task.trades ?? [],
        }
      : null

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    mode: 'onTouched',
    defaultValues: { content: '' },
    // feed 도착 시 초기값 동기화 (외부 reactive 값).
    values: { content: post?.content ?? '' },
  })

  const { mutate: update, isPending } = useUpdatePost({
    mutation: {
      onSuccess: () => {
        toast({ description: '작업물이 수정되었어요', variant: 'success' })
        router.back()
      },
      onError: (error) =>
        toast({
          description: isApiErrorShape(error) ? error.message : '다시 시도해주세요',
          variant: 'error',
        }),
    },
  })

  const onSubmit = form.handleSubmit((vals) => {
    update({ id: postId, data: { content: vals.content } })
  })

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <TopBar
          variant="default"
          title="작업물 수정"
          showAction={false}
          onBack={() => router.back()}
        />
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
        </div>
      </div>
    )
  }

  if (isError || !post) {
    return (
      <div className="flex flex-col">
        <TopBar
          variant="default"
          title="작업물 수정"
          showAction={false}
          onBack={() => router.back()}
        />
        <p className="py-20 text-center text-sm text-gray-400">작업물을 불러오지 못했어요</p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <WorkPostForm
        title="작업물 수정"
        actionLabel="완료"
        onAction={onSubmit}
        onBack={() => router.back()}
        actionDisabled={isPending}
        meta={meta}
        imageSlot={<ReadonlyImages images={post.images ?? []} />}
        contentSlot={
          <TextareaField
            control={form.control}
            name="content"
            aria-label="작업 설명"
            placeholder="작업 내용을 입력해주세요"
            className="min-h-50 rounded-none resize-none p-0 border-0 text-sm"
          />
        }
      />
    </Form>
  )
}
