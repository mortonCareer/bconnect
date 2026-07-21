/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=3341-7934
 */
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGetMySentRecommendations, useUpdateRecommendation } from '@bconnect/api-client'
import { isApiErrorShape, toast } from '@bconnect/ui'
import { RecommendationEditor } from '@/app/(main)/_components/RecommendationEditor'

export default function EditRecommendationPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const [serverError, setServerError] = useState<string>()

  // get-by-id 엔드포인트가 없어 보낸 추천서 목록에서 prefill (진입은 목록 케밥 → 캐시 hit)
  const { data: sent } = useGetMySentRecommendations()
  const initialContent = sent?.find((rec) => rec.id === id)?.content ?? ''

  const { mutate, isPending } = useUpdateRecommendation({
    mutation: {
      // 무효화(update→보낸 추천서 목록)는 orval mutationInvalidates 가 자동 처리 (ADR-0025)
      onSuccess: () => {
        toast({ description: '추천서를 수정했어요', variant: 'success' })
        router.back()
      },
      onError: (error) =>
        setServerError(
          isApiErrorShape(error) ? error.message : '수정하지 못했어요. 다시 시도해주세요'
        ),
    },
  })

  return (
    <RecommendationEditor
      title="추천서 수정"
      initialContent={initialContent}
      isPending={isPending}
      serverError={serverError}
      onSubmit={(content) => mutate({ id, data: { content } })}
      onBack={() => router.back()}
    />
  )
}
