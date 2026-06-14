'use client'

import Link from 'next/link'
import { getCredentialLabel } from '@bconnect/api-client'
import type { Credential } from '@bconnect/api-client'
import { Button, CheckCircleFilledIcon } from '@bconnect/ui'
import { formatDate } from '@bconnect/config/format'
import { getApplyLocation } from '../_lib/applyTabs'

interface CredentialItemProps {
  credential: Credential
  onRequestDelete: (id: number) => void
}

export function CredentialItem({ credential, onRequestDelete }: CredentialItemProps) {
  const label = getCredentialLabel(credential.type)
  const expiryText = credential.expiredAt ? `${formatDate(credential.expiredAt)} 만료` : null
  const canRenew = credential.status === 'ACCEPTED'
  const { tab, sub } = getApplyLocation(credential.type)
  const renewHref = `/profile/certifications/apply?tab=${tab}${sub ? `&sub=${sub}` : ''}`

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <CheckCircleFilledIcon className="shrink-0 text-primary" />
      <div className="flex flex-1 items-baseline gap-2">
        <span className="text-m-14 text-gray-900">{label}</span>
        {expiryText && <span className="text-r-12 text-gray-500">{expiryText}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {canRenew && (
          <Button asChild variant="outline" size="small">
            <Link href={renewHref}>갱신</Link>
          </Button>
        )}
        <Button variant="destructive" size="small" onClick={() => onRequestDelete(credential.id)}>
          삭제
        </Button>
      </div>
    </div>
  )
}
