/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1239-7490
 */
'use client'

import { useCreatePost, useGetMyMember, useGetTasks } from '@bconnect/api-client'
import {
  Button,
  Form,
  ImageField,
  isApiErrorShape,
  TextareaField,
  toast,
  TopBar,
} from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseAsInteger, useQueryState } from 'nuqs'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { WorkPostForm, type WorkPostMeta } from '../_components/WorkPostForm'
import { uploadPostImages } from '../_lib/uploadPostImages'

const publishSchema = z.object({
  images: z
    .array(z.custom<File>((v) => v instanceof File))
    .min(1, '작업 사진을 1장 이상 첨부해주세요.'),
  content: z.string().min(1, '작업 설명을 입력해주세요.'),
})
type PublishValues = z.infer<typeof publishSchema>

/** taskId 부재/무효 시 — 등록 폼 대신 안내. 작업 상세에서 진입해야 taskId 가 붙는다. */
function NoTaskState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="작업물 게시" showAction={false} onBack={onBack} />
      <div className="flex flex-col items-center gap-4 px-4 py-20 text-center">
        <p className="text-sm text-gray-500">작업을 선택한 뒤 게시해주세요</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/calendar">캘린더로 이동</Link>
        </Button>
      </div>
    </div>
  )
}

export default function NewWorkPage() {
  const router = useRouter()
  const [taskId] = useQueryState('taskId', parseAsInteger)

  const { data: myMember } = useGetMyMember()
  const { data: tasks, isLoading: tasksLoading } = useGetTasks()
  const task = taskId != null ? tasks?.find((t) => t.id === taskId) : undefined
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

  const form = useForm<PublishValues>({
    resolver: zodResolver(publishSchema),
    mode: 'onTouched',
    defaultValues: { images: [], content: '' },
  })

  const { mutateAsync: createPost } = useCreatePost()
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = form.handleSubmit(async (vals) => {
    if (taskId == null) return
    const memberId = myMember?.id
    if (memberId == null) {
      toast({ description: '로그인 정보를 확인해주세요', variant: 'error' })
      return
    }

    setSubmitting(true)
    try {
      const attachmentIds = await uploadPostImages(vals.images, memberId)
      await createPost({ data: { taskId, attachmentIds, content: vals.content } })
      toast({ description: '작업물이 게시되었어요', variant: 'success' })
      router.push('/profile?tab=works')
    } catch (error) {
      toast({
        description: isApiErrorShape(error)
          ? error.message
          : '게시에 실패했어요. 다시 시도해주세요',
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  })

  // taskId 무효 또는 (로딩 끝났는데) 해당 작업 없음 → 안내 상태.
  if (taskId == null || (!tasksLoading && !task)) {
    return <NoTaskState onBack={() => router.back()} />
  }

  return (
    <Form {...form}>
      <WorkPostForm
        title="작업물 게시"
        actionLabel="게시"
        onAction={onSubmit}
        onBack={() => router.back()}
        actionDisabled={submitting}
        meta={meta}
        imageSlot={<ImageField control={form.control} name="images" multiple maxFiles={10} />}
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
