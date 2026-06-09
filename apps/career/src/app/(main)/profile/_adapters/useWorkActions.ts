'use client'

import { getGetFeedsQueryKey, useDeletePost, useQueryClient } from '@bconnect/api-client'
import { isApiErrorShape, toast } from '@bconnect/ui'

/** 작업물(WorkCard) 케밥 삭제 — mutation·invalidate·toast 는 career 정책이라 앱 어댑터가 소유 */
export function useWorkActions(profileId: number) {
  const queryClient = useQueryClient()

  const remove = useDeletePost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFeedsQueryKey({ profileId }) })
        toast({ description: '작업물을 삭제했어요', variant: 'success' })
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
    onDeleteWork: (postId: number) => remove.mutate({ postId }),
  }
}
