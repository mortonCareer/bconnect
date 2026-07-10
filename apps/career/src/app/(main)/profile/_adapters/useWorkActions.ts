'use client'

import { useDeletePost } from '@bconnect/api-client'
import { isApiErrorShape, toast } from '@bconnect/ui'

/**
 * 작업물(WorkCard) 케밥 삭제 — toast 는 career 정책이라 앱 어댑터가 소유.
 * 피드 무효화는 orval mutationInvalidates(deletePost→getFeeds)가 자동 주입 (ADR-0025).
 */
export function useWorkActions() {
  const remove = useDeletePost({
    mutation: {
      onSuccess: () => {
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
    onDeleteWork: (postId: number) => remove.mutate({ id: postId }),
  }
}
