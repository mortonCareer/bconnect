/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=3341-7801
 */
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCreateRecommendation } from '@bconnect/api-client'
import { isApiErrorShape, toast } from '@bconnect/ui'
import { RecommendationEditor } from '@/app/(main)/_components/RecommendationEditor'

export default function CreateRecommendationPage() {
  const router = useRouter()
  const params = useParams<{ memberId: string }>()
  const toId = Number(params.memberId)
  const [serverError, setServerError] = useState<string>()

  const { mutate, isPending } = useCreateRecommendation({
    mutation: {
      // 무효화(create→보낸/받은 추천서 목록)는 orval mutationInvalidates 가 자동 처리 (ADR-0025)
      onSuccess: () => {
        toast({ description: '추천서를 작성했어요', variant: 'success' })
        router.back()
      },
      onError: (error) =>
        setServerError(
          isApiErrorShape(error) ? error.message : '작성하지 못했어요. 다시 시도해주세요'
        ),
    },
  })

  return (
    <RecommendationEditor
      title="추천서 작성"
      isPending={isPending}
      serverError={serverError}
      onSubmit={(content) => mutate({ data: { toId, content } })}
      onBack={() => router.back()}
    />
  )
}
