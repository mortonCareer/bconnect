'use client'

import type { Credential } from '@bconnect/api-client'
import { Button, Skeleton } from '@bconnect/ui'
import { CredentialItem } from './CredentialItem'

interface CredentialListProps {
  credentials: Credential[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onRequestDelete: (id: number) => void
  /** 빈 상태 문구 — 탭별 맞춤 */
  emptyText: string
}

/**
 * 신청 화면 하단 자격 증빙 목록 — 3탭 공통. 로딩(스켈레톤)·에러(재시도)·빈(문구)·목록 상태를 한 곳에서.
 * 데이터는 page 의 useGetCredentials 한 쿼리를 공유하므로 isLoading/isError/onRetry 를 주입받는다.
 */
export function CredentialList({
  credentials,
  isLoading,
  isError,
  onRetry,
  onRequestDelete,
  emptyText,
}: CredentialListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col divide-y divide-gray-300">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-[18px] shrink-0 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className="text-r-14 text-gray-500">자격 증빙을 불러오지 못했어요</p>
        <Button variant="outline" size="small" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    )
  }

  if (credentials.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-r-14 text-gray-500">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-gray-300">
      {credentials.map((credential) => (
        <CredentialItem
          key={credential.id}
          credential={credential}
          onRequestDelete={onRequestDelete}
          showRenew={false}
        />
      ))}
    </div>
  )
}
