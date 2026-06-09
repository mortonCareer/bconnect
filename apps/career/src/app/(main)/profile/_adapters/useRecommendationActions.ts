'use client'

import {
  getGetMyReceivedRecommendationsQueryKey,
  getGetMySentRecommendationsQueryKey,
  useDeleteRecommendation,
  useHideRecommendation,
  useQueryClient,
} from '@bconnect/api-client'
import { isApiErrorShape, toast } from '@bconnect/ui'

export function useRecommendationActions() {
  const queryClient = useQueryClient()

  const hide = useHideRecommendation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyReceivedRecommendationsQueryKey() })
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

  const remove = useDeleteRecommendation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMySentRecommendationsQueryKey() })
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
    onDeleteRecommendation: (id: number) => remove.mutate({ id }),
  }
}
