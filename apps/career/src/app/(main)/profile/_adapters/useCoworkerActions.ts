'use client'

import { useDeleteCoworker } from '@bconnect/api-client'
import { isApiErrorShape, toast } from '@bconnect/ui'

// 무효화(deleteCoworker→동료 목록/카운트)는 orval mutationInvalidates 가 자동 처리 (ADR-0025)
export function useCoworkerActions() {
  const remove = useDeleteCoworker({
    mutation: {
      onSuccess: () => {
        toast({ description: '동료를 취소했어요', variant: 'success' })
      },
      onError: (error) =>
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '동료 취소에 실패했어요. 다시 시도해주세요',
          variant: 'error',
        }),
    },
  })

  return {
    onDeleteCoworker: (memberId: number) => remove.mutate({ memberId }),
    isDeletingCoworker: remove.isPending,
  }
}
