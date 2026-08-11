'use client'

import { useState } from 'react'
import {
  useCreateCoworkerRequest,
  useGetReceivedCoworkerRequests,
  useGetSentCoworkerRequests,
} from '@bconnect/api-client'
import type { Coworker } from '@bconnect/api-client'
import { isApiErrorShape, toast } from '@bconnect/ui'
import { useCoworkerActions } from './useCoworkerActions'
import { useCoworkerRequestActions } from './useCoworkerRequestActions'
import { useMessageMember } from './useMessageMember'

/**
 * 동료 목록 행 ⋮ → CoworkerManageDrawer 배선 (#870).
 *
 * 드로어에 넘길 상태는 목록 응답의 coworker.status 를 그대로 쓴다 — BE 가 "로그인한 나와
 * 그 사람의 관계"로 계산해 내려주므로(CoworkerController.resolveStatusMap(user.id(), ...)),
 * 내 동료 목록은 전부 COWORKER, 타인의 동료 목록은 NONE/SENT/RECEIVED/COWORKER 가 섞인다.
 *
 * SENT·RECEIVED 액션은 request id 가 필요한데 Coworker 엔 없어, 보낸/받은 요청 목록에서
 * memberId 로 역매핑한다. 대상(target)과 가시성(open)을 분리해 삭제 탭으로 드로어가 닫혀도
 * 확인 다이얼로그가 대상 정보를 잃지 않게 한다.
 */
export function useCoworkerManageDrawer() {
  const [target, setTarget] = useState<Coworker | null>(null)
  const [open, setOpen] = useState(false)
  const targetId = target?.member?.id

  const { data: sentRequests } = useGetSentCoworkerRequests()
  const { data: receivedRequests } = useGetReceivedCoworkerRequests()
  const sentRequestId = sentRequests?.find((it) => it.member?.id === targetId)?.id
  const receivedRequestId = receivedRequests?.find((it) => it.member?.id === targetId)?.id

  const { onAccept, onDeny, onCancel, pendingId } = useCoworkerRequestActions()
  const { onDeleteCoworker, isDeletingCoworker } = useCoworkerActions()
  const { onMessage, isMessaging } = useMessageMember()

  const add = useCreateCoworkerRequest({
    mutation: {
      onSuccess: () => toast({ description: '동료 요청을 보냈어요', variant: 'success' }),
      onError: (error) =>
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '동료 요청에 실패했어요. 다시 시도해주세요',
          variant: 'error',
        }),
    },
  })

  const requestPending =
    (sentRequestId != null && pendingId === sentRequestId) ||
    (receivedRequestId != null && pendingId === receivedRequestId)

  return {
    /** 행 ⋮ 클릭 시 호출 — 대상을 잡고 드로어를 연다 */
    openFor: (coworker: Coworker) => {
      setTarget(coworker)
      setOpen(true)
    },
    /** CoworkerManageDrawer 에 그대로 스프레드 */
    drawerProps: {
      open,
      onOpenChange: setOpen,
      status: target?.status,
      memberName: target?.member?.name ?? undefined,
      pending: add.isPending || isDeletingCoworker || isMessaging || requestPending,
      onAdd: () => targetId != null && add.mutate({ data: { toId: targetId } }),
      onCancelRequest: () => sentRequestId != null && onCancel(sentRequestId),
      onAccept: () => receivedRequestId != null && onAccept(receivedRequestId),
      onDeny: () => receivedRequestId != null && onDeny(receivedRequestId),
      onDelete: () => targetId != null && onDeleteCoworker(targetId),
      onMessage: () => targetId != null && onMessage(targetId),
    },
  }
}
