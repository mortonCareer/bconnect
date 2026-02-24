'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@morton/ui'
import {
  formatRegistrationNumber,
  extractDigits,
  isValidRegistrationNumber,
} from './constants'

interface SearchBarProps {
  defaultValue?: string
}

export function SearchBar({ defaultValue }: SearchBarProps) {
  const router = useRouter()
  const [value, setValue] = useState(
    defaultValue ? formatRegistrationNumber(defaultValue) : ''
  )
  const [isLoading, setIsLoading] = useState(false)

  const digits = extractDigits(value)
  const isValid = isValidRegistrationNumber(value)

  const handleSearch = useCallback(() => {
    if (!isValid) return
    setIsLoading(true)
    router.push(`/one-click?q=${digits}`)
  }, [isValid, digits, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(formatRegistrationNumber(e.target.value))
    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        inputMode="numeric"
        placeholder="사업자 등록번호를 입력해주세요"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="flex-1"
      />
      <Button
        variant="primary"
        className="h-[50px] w-[100px] shrink-0"
        onClick={handleSearch}
        disabled={!isValid}
        isLoading={isLoading}
        loadingText="조회 중..."
      >
        조회
      </Button>
    </div>
  )
}
