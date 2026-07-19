/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=3341-7801
 */
'use client'

import { Form, TextareaField, TopBar } from '@bconnect/ui'
import { useForm } from 'react-hook-form'

type RecommendationFormValues = { content: string }

interface RecommendationEditorProps {
  title: string
  initialContent?: string
  isPending: boolean
  serverError?: string
  onSubmit: (content: string) => void
  onBack: () => void
}

export function RecommendationEditor({
  title,
  initialContent = '',
  isPending,
  serverError,
  onSubmit,
  onBack,
}: RecommendationEditorProps) {
  const form = useForm<RecommendationFormValues>({
    mode: 'onTouched',
    values: { content: initialContent },
  })

  const submit = form.handleSubmit((data) => onSubmit(data.content.trim()))
  const isEmpty = form.watch('content').trim().length === 0

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        variant="default"
        title={title}
        actionLabel={isPending ? '저장 중...' : '완료'}
        actionDisabled={isPending || isEmpty}
        onAction={submit}
        onBack={onBack}
      />

      <Form {...form}>
        <form onSubmit={submit} className="flex flex-1 flex-col gap-4 px-4 pb-4 pt-4">
          <TextareaField
            control={form.control}
            name="content"
            placeholder="추천 내용을 작성해주세요..."
            className="min-h-100 rounded-none border-0 px-0"
            serverError={serverError}
            disabled={isPending}
          />
        </form>
      </Form>
    </div>
  )
}
