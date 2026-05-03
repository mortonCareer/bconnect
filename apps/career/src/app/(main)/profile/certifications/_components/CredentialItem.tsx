'use client'

import type { Credential } from '@bconnect/api-client'
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
        {/* 체크 아이콘 — outline 스타일 (Figma) */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="shrink-0 text-bconnect-primary"
        >
          <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M6.5 10L9 12.5L13.5 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* 인증명 + 만료일 — 같은 줄 */}
        <div className="flex items-baseline gap-2">
          <span className="text-sb-14 text-bconnect-gray-900">{label}</span>
          {expiryText && <span className="text-r-12 text-bconnect-gray-500">{expiryText}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onRenew && credential.id !== undefined && (
          <button
            className="rounded border border-bconnect-primary px-3 py-1 text-r-14 text-bconnect-primary"
            onClick={() => onRenew(credential.id!)}
          >
            갱신
          </button>
        )}
        {credential.id !== undefined && (
          <button
            className="rounded border border-bconnect-gray-500 px-3 py-1 text-r-14 text-bconnect-gray-500"
            onClick={() => onDelete(credential.id!)}
            disabled={isDeleting}
          >
            삭제
          </button>
        )}
      </div>
    </div>
  )
}
