'use client'

import { useState } from 'react'
import type { Credential } from '@morton/api-client'
import { Button, Input } from '@morton/ui'
import { CredentialItem } from '../../_components/CredentialItem'
import { formatDate } from '../../constants'

interface OneClickTabProps {
  credentials: Credential[]
  onDelete: (id: number) => void
  isDeleting: boolean
}

export function OneClickTab({ credentials, onDelete, isDeleting }: OneClickTabProps) {
  const [businessNumber, setBusinessNumber] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [openDate, setOpenDate] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const oneClickTypes = [
    'IDENTITY_VERIFICATION',
    'SOLE_PROPRIETOR',
    'CONSTRUCTION_LICENSE',
    'SPECIALTY_CONSTRUCTION_LICENSE',
  ] as const

  const oneClickCredentials = credentials.filter(
    (c) => c.type && (oneClickTypes as readonly string[]).includes(c.type)
  )

  const handleSearch = () => {
    setIsSearching(true)
    // TODO: 원클릭 조회 API 연동
    setTimeout(() => setIsSearching(false), 1000)
  }

  const lastUpdated =
    oneClickCredentials.length > 0
      ? oneClickCredentials
          .filter((c) => c.modifiedAt)
          .sort((a, b) => new Date(b.modifiedAt!).getTime() - new Date(a.modifiedAt!).getTime())[0]
          ?.modifiedAt
      : null

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <p className="text-m-14 text-morton-gray-700">사업자 및 면허 정보를 한 번에 인증하세요.</p>

      {/* 입력 폼 */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-r-12 text-morton-gray-700">사업자등록번호</label>
          <Input
            placeholder="000-00-00000"
            value={businessNumber}
            onChange={(e) => setBusinessNumber(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-r-12 text-morton-gray-700">대표자성명</label>
          <Input
            placeholder="홍길동"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-r-12 text-morton-gray-700">개업일자</label>
          <Input
            placeholder="YYYY-MM-DD"
            value={openDate}
            onChange={(e) => setOpenDate(e.target.value)}
          />
        </div>
      </div>

      <Button
        variant="primary"
        size="full"
        onClick={handleSearch}
        isLoading={isSearching}
        loadingText="조회 중..."
        disabled={!businessNumber || !ownerName || !openDate}
      >
        조회하기
      </Button>

      {/* 조회 결과 */}
      {oneClickCredentials.length > 0 && (
        <div className="flex flex-col">
          {lastUpdated && (
            <p className="px-0 pb-2 text-r-12 text-morton-gray-500">
              {formatDate(lastUpdated)} 업데이트됨
            </p>
          )}
          <div className="flex flex-col divide-y divide-morton-gray-300 rounded-lg border border-morton-gray-300">
            {oneClickCredentials.map((credential) => (
              <CredentialItem
                key={credential.id}
                credential={credential}
                onDelete={onDelete}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
