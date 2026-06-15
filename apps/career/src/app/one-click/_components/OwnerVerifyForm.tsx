'use client'

import { useState } from 'react'
import { Button, Input } from '@bconnect/ui'
import type { VerifyOwnerResult } from '@/lib/business/types'

interface OwnerVerifyFormProps {
  registrationNumber: string
}

export function OwnerVerifyForm({ registrationNumber }: OwnerVerifyFormProps) {
  const [ownerName, setOwnerName] = useState('')
  const [openDate, setOpenDate] = useState('')
  const [result, setResult] = useState<VerifyOwnerResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = ownerName.trim().length > 0 && openDate.trim().length > 0

  const handleVerify = async () => {
    if (!isValid) return
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/one-click/verify-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNumber,
          ownerName: ownerName.trim(),
          openDate: openDate.trim(),
        }),
      })

      if (!res.ok) throw new Error('조회에 실패했습니다.')

      const data: VerifyOwnerResult = await res.json()
      setResult(data)
    } catch {
      setError('진위확인에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-gray-300 p-4">
      <h4 className="text-sb-14 text-gray-900">사업자 진위확인</h4>
      <p className="mt-1 text-r-12 text-gray-500">
        대표자명, 개업일자가 등록된 정보와 일치하는지 확인해요. (출처: 국세청)
      </p>

      <div className="mt-3 flex items-center gap-2">
        <Input
          type="text"
          placeholder="대표자 성명"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          className="h-10 flex-1"
        />
        <Input
          type="text"
          placeholder="개업일자 (YYYY-MM-DD)"
          value={openDate}
          onChange={(e) => setOpenDate(e.target.value)}
          className="h-10 flex-1"
        />
        <Button
          variant="primary"
          className="h-10 w-20 shrink-0"
          onClick={handleVerify}
          disabled={!isValid}
          isLoading={isLoading}
        >
          조회
        </Button>
      </div>

      {result && (
        <p className={`mt-2 text-r-12 ${result.valid ? 'text-[#2E7D32]' : 'text-destructive'}`}>
          {result.message}
        </p>
      )}
      {error && <p className="mt-2 text-r-12 text-destructive">{error}</p>}
    </div>
  )
}
