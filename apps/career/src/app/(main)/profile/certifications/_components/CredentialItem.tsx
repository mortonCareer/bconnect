'use client'

import type { Credential } from '@morton/api-client'
import { Button } from '@morton/ui'
import { getCredentialLabel, formatDate } from '../constants'

interface CredentialItemProps {
  credential: Credential
  onDelete: (id: number) => void
  onRenew?: (id: number) => void
  isDeleting?: boolean
}

export function CredentialItem({ credential, onDelete, onRenew, isDeleting }: CredentialItemProps) {
  const label = credential.type ? getCredentialLabel(credential.type) : '알 수 없음'
  const expiryText = credential.expiredAt ? `${formatDate(credential.expiredAt)} 만료` : null

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex size-5 items-center justify-center rounded-full bg-morton-primary">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-m-14 text-morton-gray-900">{label}</span>
          {expiryText && <span className="text-r-12 text-morton-gray-500">{expiryText}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onRenew && credential.id !== undefined && (
          <Button
            variant="outline"
            className="h-[32px] w-auto px-3 text-xs"
            onClick={() => onRenew(credential.id!)}
          >
            갱신
          </Button>
        )}
        {credential.id !== undefined && (
          <Button
            variant="ghost"
            className="h-[32px] w-auto px-3 text-xs"
            onClick={() => onDelete(credential.id!)}
            disabled={isDeleting}
          >
            삭제
          </Button>
        )}
      </div>
    </div>
  )
}
