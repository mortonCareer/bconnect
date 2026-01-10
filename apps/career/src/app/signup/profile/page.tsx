'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BackButton, ProgressBar, Button } from '@morton/ui'
import { FieldSelector, ExperienceSelector } from './components'
import { FIELD_OPTIONS, EXPERIENCE_OPTIONS } from './constants'
import type { ConstructionField, ExperienceLevel } from './types'

export default function SignupProfilePage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [selectedFields, setSelectedFields] = useState<ConstructionField[]>([])
  const [primaryField, setPrimaryField] = useState<ConstructionField | null>(null)
  const [experience, setExperience] = useState<ExperienceLevel | null>(null)
  const [affiliation, setAffiliation] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const toggleField = (field: ConstructionField) => {
    setSelectedFields((prev) => {
      if (prev.includes(field)) {
        const newFields = prev.filter((f) => f !== field)
        if (primaryField === field) {
          setPrimaryField(newFields[0] || null)
        }
        return newFields
      } else if (prev.length < 3) {
        const newFields = [...prev, field]
        if (!primaryField) {
          setPrimaryField(field)
        }
        return newFields
      }
      return prev
    })
  }

  const handleSubmit = useCallback(async () => {
    if (!name || selectedFields.length === 0 || !experience) return

    setIsLoading(true)

    try {
      // TODO: API 호출로 프로필 저장
      router.push('/signup/complete')
    } catch {
      // 에러 처리
    } finally {
      setIsLoading(false)
    }
  }, [name, selectedFields, experience, router])

  const isValid = name.trim().length > 0 && selectedFields.length > 0 && experience !== null

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top Bar */}
      <header className="flex h-[60px] items-center justify-between px-4 py-5">
        <BackButton onClick={() => router.back()} />
        <ProgressBar step={3} total={3} />
        <div className="size-5" />
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-24 pt-3">
        {/* Title */}
        <h1 className="text-2xl font-semibold leading-[1.4] text-[#1B1B1B]">
          기술자님의 시공분야와
          <br />
          역할을 선택해주세요
        </h1>

        {/* Name Input */}
        <div className="flex flex-col gap-3">
          <label className="text-sm leading-[1.6] text-[#1B1B1B]">
            이름<span className="text-[#FF4242]">*</span>
          </label>
          <div className="flex h-[50px] items-center rounded-lg border border-[#E5E7EB] px-3 py-[7px]">
            <input
              type="text"
              placeholder="내용을 입력해주세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-base leading-[1.6] text-[#1B1B1B] placeholder:text-[#9C9C9C] focus:outline-none"
            />
          </div>
        </div>

        {/* Construction Fields */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm leading-[1.6] text-[#1B1B1B]">
              시공분야<span className="text-[#FF4242]">*</span>
            </label>
            <p className="text-xs leading-[1.6] text-[#9C9C9C]">
              대표 시공분야는 최대 3개까지 선택 가능해요.
            </p>
          </div>
          <FieldSelector options={FIELD_OPTIONS} selected={selectedFields} onToggle={toggleField} />
        </div>

        {/* Primary Field */}
        {selectedFields.length > 0 && (
          <div className="flex flex-col gap-3">
            <label className="text-sm leading-[1.6] text-[#1B1B1B]">
              대표분야<span className="text-[#FF4242]">*</span>
            </label>
            <select
              value={primaryField || ''}
              onChange={(e) => setPrimaryField(e.target.value as ConstructionField)}
              className="flex h-[30px] items-center rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-sm font-medium text-[#1B1B1B]"
            >
              {selectedFields.map((fieldId) => {
                const field = FIELD_OPTIONS.find((f) => f.id === fieldId)
                return (
                  <option key={fieldId} value={fieldId}>
                    {field?.label}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        {/* Experience */}
        <div className="flex flex-col gap-3">
          <label className="text-sm leading-[1.6] text-[#1B1B1B]">
            경력<span className="text-[#FF4242]">*</span>
          </label>
          <ExperienceSelector
            options={EXPERIENCE_OPTIONS}
            selected={experience}
            onSelect={setExperience}
          />
        </div>

        {/* Affiliation */}
        <div className="flex flex-col gap-3">
          <label className="text-sm leading-[1.6] text-[#1B1B1B]">
            소속<span className="text-[#FF4242]">*</span>
          </label>
          <div className="flex h-[50px] items-center rounded-lg border border-[#E5E7EB] px-3 py-[7px]">
            <input
              type="text"
              placeholder="소속을 입력해주세요"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              className="w-full bg-transparent text-base leading-[1.6] text-[#1B1B1B] placeholder:text-[#9C9C9C] focus:outline-none"
            />
          </div>
        </div>
      </main>

      {/* Fixed Submit Button */}
      <div className="fixed inset-x-0 bottom-0 bg-white px-4 pb-8 pt-4">
        <Button
          variant="primary"
          size="full"
          onClick={handleSubmit}
          disabled={!isValid}
          isLoading={isLoading}
          loadingText="저장 중..."
        >
          완료
        </Button>
      </div>
    </div>
  )
}
