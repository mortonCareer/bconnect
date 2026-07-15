'use client'

import {
  useAcceptCoworkerRequest,
  useDenyCoworkerRequest,
  useDeleteCoworkerRequest,
} from '@bconnect/api-client'
import { isApiErrorShape, toast } from '@bconnect/ui'

// 무효화(수락/거절→받은목록·동료목록 / 취소→보낸목록)는 orval mutationInvalidates 가 자동 처리 (#843, ADR-0025)
export function useCoworkerRequestActions() {
  const accept = useAcceptCoworkerRequest({
    mutation: {
      onSuccess: () => toast({ description: '동료 요청을 수락했어요', variant: 'success' }),
      onError: (error) =>
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '수락하지 못했어요. 다시 시도해주세요',
          variant: 'error',
        }),
    },
  })

  const deny = useDenyCoworkerRequest({
    mutation: {
      onSuccess: () => toast({ description: '동료 요청을 거절했어요', variant: 'success' }),
      onError: (error) =>
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '거절하지 못했어요. 다시 시도해주세요',
          variant: 'error',
        }),
    },
  })

  const cancel = useDeleteCoworkerRequest({
    mutation: {
      onSuccess: () => toast({ description: '동료 요청을 취소했어요', variant: 'success' }),
      onError: (error) =>
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '취소하지 못했어요. 다시 시도해주세요',
          variant: 'error',
        }),
    },
  })

  // 처리 중인 요청 id — 해당 행 버튼만 비활성 (중복 클릭 방지)
  const pendingId =
    (accept.isPending ? accept.variables?.id : undefined) ??
    (deny.isPending ? deny.variables?.id : undefined) ??
    (cancel.isPending ? cancel.variables?.id : undefined) ??
    null

  return {
    onAccept: (id: number) => accept.mutate({ id }),
    onDeny: (id: number) => deny.mutate({ id }),
    onCancel: (id: number) => cancel.mutate({ id }),
    pendingId,
  }
}
