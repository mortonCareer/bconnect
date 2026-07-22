'use client'

import {
  useDeleteRecommendation,
  useHideRecommendation,
  useShowRecommendation,
} from '@bconnect/api-client'
import { isApiErrorShape, toast } from '@bconnect/ui'

// 무효화(hide/show→받은목록 / delete→보낸목록)는 orval mutationInvalidates 가 자동 처리 (#728, ADR-0025)
export function useRecommendationActions() {
  const hide = useHideRecommendation({
    mutation: {
      onSuccess: () => {
        toast({ description: '추천서를 숨겼어요', variant: 'success' })
      },
      onError: (error) =>
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '숨기지 못했어요. 다시 시도해주세요',
          variant: 'error',
        }),
    },
  })

  const show = useShowRecommendation({
    mutation: {
      onSuccess: () => {
        toast({ description: '추천서 숨김을 해제했어요', variant: 'success' })
      },
      onError: (error) =>
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '숨김 해제에 실패했어요. 다시 시도해주세요',
          variant: 'error',
        }),
    },
  })

  const remove = useDeleteRecommendation({
    mutation: {
      onSuccess: () => {
        toast({ description: '추천서를 삭제했어요', variant: 'success' })
      },
      onError: (error) =>
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '삭제하지 못했어요. 다시 시도해주세요',
          variant: 'error',
        }),
    },
  })

  return {
    onHideRecommendation: (id: number) => hide.mutate({ id }),
    onShowRecommendation: (id: number) => show.mutate({ id }),
    onDeleteRecommendation: (id: number) => remove.mutate({ id }),
  }
}
