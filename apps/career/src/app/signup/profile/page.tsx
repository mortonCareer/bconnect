'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BackButton, ProgressBar, Button } from '@morton/ui'
import { useSignupStore } from '@/stores/signup-store'
import { FieldSelector, ExperienceSelector } from './components'
import { FIELD_OPTIONS, EXPERIENCE_OPTIONS } from './constants'
import { profileSchema, type ProfileFormData } from './schema'
import type { ConstructionField } from './types'

export default function SignupProfilePage() {
  const router = useRouter()
  const { formData, setProfile } = useSignupStore()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      name: formData.name || '',
      fields: formData.fields || [],
      primaryField: formData.primaryField || undefined,
      experience: formData.experience || undefined,
      affiliation: formData.affiliation || '',
    },
  })

  const watchedFields = useWatch({ control, name: 'fields' })
  const watchedPrimaryField = useWatch({ control, name: 'primaryField' })

  const selectedFields = watchedFields || []

  // 시공분야 선택 시 대표분야 자동 설정
  useEffect(() => {
    if (
      watchedFields &&
      watchedFields.length > 0 &&
      !watchedFields.includes(watchedPrimaryField as ConstructionField)
    ) {
      setValue('primaryField', watchedFields[0])
    }
  }, [watchedFields, watchedPrimaryField, setValue])

  const toggleField = (field: ConstructionField) => {
    const currentFields = selectedFields || []
    if (currentFields.includes(field)) {
      setValue(
        'fields',
        currentFields.filter((f) => f !== field),
        { shouldValidate: true }
      )
    } else if (currentFields.length < 3) {
      setValue('fields', [...currentFields, field], { shouldValidate: true })
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Store에 프로필 데이터 저장
      setProfile({
        name: data.name,
        fields: data.fields,
        primaryField: data.primaryField,
        experience: data.experience,
        affiliation: data.affiliation || '',
      })

      // 전체 회원가입 데이터 확인
      const signupData = {
        // username 페이지에서 저장한 데이터
        username: formData.username,
        // profile 페이지에서 입력한 데이터
        name: data.name,
        fields: data.fields,
        primaryField: data.primaryField,
        experience: data.experience,
        affiliation: data.affiliation || '',
      }
      console.log('=== 회원가입 완료 데이터 ===')
      console.log(signupData)

      // TODO: API 호출로 프로필 저장
      router.push('/signup/complete')
    } catch {
      // 에러 처리
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top Bar */}
      <header className="flex h-[60px] items-center justify-between px-4 py-5">
        <BackButton onClick={() => router.back()} />
        <ProgressBar step={3} total={3} />
        <div className="size-5" />
      </header>

      {/* Content */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-24 pt-3"
      >
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
              {...register('name')}
              className="w-full bg-transparent text-base leading-[1.6] text-[#1B1B1B] placeholder:text-[#9C9C9C] focus:outline-none"
            />
          </div>
          {errors.name && (
            <p className="text-sm leading-[1.6] text-[#FF4242]">{errors.name.message}</p>
          )}
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
          {errors.fields && (
            <p className="text-sm leading-[1.6] text-[#FF4242]">{errors.fields.message}</p>
          )}
        </div>

        {/* Primary Field */}
        {selectedFields.length > 0 && (
          <div className="flex flex-col gap-3">
            <label className="text-sm leading-[1.6] text-[#1B1B1B]">
              대표분야<span className="text-[#FF4242]">*</span>
            </label>
            <Controller
              name="primaryField"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value || ''}
                  onChange={field.onChange}
                  className="flex h-[30px] items-center rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-sm font-medium text-[#1B1B1B]"
                >
                  {selectedFields.map((fieldId) => {
                    const option = FIELD_OPTIONS.find((f) => f.id === fieldId)
                    return (
                      <option key={fieldId} value={fieldId}>
                        {option?.label}
                      </option>
                    )
                  })}
                </select>
              )}
            />
          </div>
        )}

        {/* Experience */}
        <div className="flex flex-col gap-3">
          <label className="text-sm leading-[1.6] text-[#1B1B1B]">
            경력<span className="text-[#FF4242]">*</span>
          </label>
          <Controller
            name="experience"
            control={control}
            render={({ field }) => (
              <ExperienceSelector
                options={EXPERIENCE_OPTIONS}
                selected={field.value || null}
                onSelect={field.onChange}
              />
            )}
          />
          {errors.experience && (
            <p className="text-sm leading-[1.6] text-[#FF4242]">{errors.experience.message}</p>
          )}
        </div>

        {/* Affiliation */}
        <div className="flex flex-col gap-3">
          <label className="text-sm leading-[1.6] text-[#1B1B1B]">소속</label>
          <div className="flex h-[50px] items-center rounded-lg border border-[#E5E7EB] px-3 py-[7px]">
            <input
              type="text"
              placeholder="소속을 입력해주세요"
              {...register('affiliation')}
              className="w-full bg-transparent text-base leading-[1.6] text-[#1B1B1B] placeholder:text-[#9C9C9C] focus:outline-none"
            />
          </div>
        </div>
      </form>

      {/* Fixed Submit Button */}
      <div className="fixed inset-x-0 bottom-0 bg-white px-4 pb-8 pt-4">
        <Button
          type="submit"
          variant="primary"
          size="full"
          disabled={!isValid}
          isLoading={isSubmitting}
          loadingText="저장 중..."
          onClick={handleSubmit(onSubmit)}
        >
          완료
        </Button>
      </div>
    </div>
  )
}
