'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type ConstructionField =
  | 'tile'
  | 'wallpaper'
  | 'flooring'
  | 'carpentry'
  | 'demolition'
  | 'cleaning'
  | 'electrical'
  | 'plumbing'

type ExperienceLevel = 'newcomer' | '1-3' | '3-5' | '5-10' | '10+'

const FIELD_OPTIONS: { id: ConstructionField; emoji: string; label: string }[] = [
  { id: 'tile', emoji: '🪨', label: '타일' },
  { id: 'wallpaper', emoji: '🎨', label: '도배' },
  { id: 'flooring', emoji: '🪵', label: '마루/장판' },
  { id: 'carpentry', emoji: '🪚', label: '목공' },
  { id: 'demolition', emoji: '🔨', label: '철거' },
  { id: 'cleaning', emoji: '🧹', label: '청소' },
  { id: 'electrical', emoji: '⚡', label: '전기' },
  { id: 'plumbing', emoji: '🔧', label: '설비' },
]

const EXPERIENCE_OPTIONS: { id: ExperienceLevel; label: string }[] = [
  { id: 'newcomer', label: '신입' },
  { id: '1-3', label: '1~3년' },
  { id: '3-5', label: '3~5년' },
  { id: '5-10', label: '5~10년' },
  { id: '10+', label: '10년 이상' },
]

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
        // 선택 해제
        const newFields = prev.filter((f) => f !== field)
        // 대표 분야가 해제된 경우 초기화
        if (primaryField === field) {
          setPrimaryField(newFields[0] || null)
        }
        return newFields
      } else if (prev.length < 3) {
        // 최대 3개까지 선택 가능
        const newFields = [...prev, field]
        // 첫 선택 시 대표 분야로 설정
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
      // await saveProfile({ name, fields: selectedFields, primaryField, experience, affiliation })

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
        <button
          onClick={() => router.back()}
          className="flex size-5 items-center justify-center"
          aria-label="뒤로가기"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="#9C9C9C"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Progress Bar - Step 3 of 3 */}
        <div className="flex h-[3px] w-[330px] gap-1">
          <div className="h-full flex-1 rounded-full bg-[#386DFF]" />
          <div className="h-full flex-1 rounded-full bg-[#386DFF]" />
          <div className="h-full flex-1 rounded-full bg-[#386DFF]" />
        </div>

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
          <div className="grid grid-cols-4 gap-2">
            {FIELD_OPTIONS.map((field) => {
              const isSelected = selectedFields.includes(field.id)
              return (
                <button
                  key={field.id}
                  onClick={() => toggleField(field.id)}
                  className={`flex flex-col items-center gap-2 rounded-[10px] border p-2 transition-colors ${
                    isSelected ? 'border-[#386DFF] bg-[#EAEFFF]' : 'border-[#E5E7EB] bg-white'
                  }`}
                >
                  <span className="text-lg">{field.emoji}</span>
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? 'text-[#386DFF]' : 'text-[#9C9C9C]'
                    }`}
                  >
                    {field.label}
                  </span>
                </button>
              )
            })}
          </div>
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
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_OPTIONS.map((option) => {
              const isSelected = experience === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => setExperience(option.id)}
                  className={`flex h-[30px] items-center justify-center rounded-lg border px-3.5 py-[3px] text-sm font-medium transition-colors ${
                    isSelected
                      ? 'border-[#386DFF] bg-[#EAEFFF] font-semibold text-[#386DFF]'
                      : 'border-[#E5E7EB] text-[#9C9C9C]'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
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
        <button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className="flex h-[50px] w-full items-center justify-center rounded-lg bg-[#386DFF] text-sm font-semibold leading-[1.6] text-white transition-colors disabled:bg-[#F4F4F4] disabled:text-[#9C9C9C]"
        >
          {isLoading ? '저장 중...' : '완료'}
        </button>
      </div>
    </div>
  )
}
