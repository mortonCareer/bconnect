'use client'

import { useState } from 'react'
import { getCredentialLabel } from '@bconnect/api-client'
import type { Credential } from '@bconnect/api-client'
import { Button, Input } from '@bconnect/ui'
import { formatDate } from '@bconnect/config/format'

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

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <p className="text-r-12 text-gray-700">사업자 및 면허 정보를 한 번에 인증하세요.</p>

      {/* 입력 폼 */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-m-14 text-gray-900">사업자등록번호</label>
          <Input
            placeholder="000-00-00000"
            value={businessNumber}
            onChange={(e) => setBusinessNumber(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-m-14 text-gray-900">대표자 성명</label>
          <Input
            placeholder="홍길동"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-m-14 text-gray-900">개업일자</label>
          <Input
            placeholder="0000-00-00"
            value={openDate}
            onChange={(e) => setOpenDate(e.target.value)}
          />
        </div>
      </div>

      <Button variant="primary" size="full" onClick={handleSearch} isLoading={isSearching}>
        조회하기
      </Button>

      {/* 업데이트 날짜 */}
      <p className="text-center text-r-12 text-gray-700">2026.02.21 업데이트됨</p>

      {/* 하단 인증 목록 — 심플 리스트 */}
      {oneClickCredentials.length > 0 && (
        <div className="flex flex-col border-t border-gray-300 pt-4">
          {oneClickCredentials.map((credential) => (
            <div
              key={credential.id}
              className="flex items-center justify-between border-b border-gray-300 py-3"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-r-14 text-gray-900">
                  {credential.type ? getCredentialLabel(credential.type) : '알 수 없음'}
                </span>
                {credential.expiredAt && (
                  <span className="text-r-10 text-gray-700">
                    {formatDate(credential.expiredAt)} 만료
                  </span>
                )}
              </div>
              <button
                className="rounded border border-gray-500 px-3 py-1 text-r-14 text-gray-700"
                onClick={() => onDelete(credential.id!)}
                disabled={isDeleting}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
