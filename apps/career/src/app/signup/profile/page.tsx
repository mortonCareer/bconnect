'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@morton/ui'
import { useSignupStore } from '@/stores/signup-store'
import { SignupHeader, FormInput, FormLabel, FormError } from '../_components'
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
      <SignupHeader step={3} onBack={() => router.back()} />

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
          <FormLabel required>이름</FormLabel>
          <FormInput type="text" placeholder="내용을 입력해주세요" {...register('name')} />
          <FormError message={errors.name?.message} />
        </div>

        {/* Construction Fields */}
        <div className="flex flex-col gap-3">
          <FormLabel required description="대표 시공분야는 최대 3개까지 선택 가능해요.">
            시공분야
          </FormLabel>
          <FieldSelector options={FIELD_OPTIONS} selected={selectedFields} onToggle={toggleField} />
          <FormError message={errors.fields?.message} />
        </div>

        {/* Primary Field */}
        {selectedFields.length > 0 && (
          <div className="flex flex-col gap-3">
            <FormLabel required>대표분야</FormLabel>
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
          <FormLabel required>경력</FormLabel>
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
          <FormError message={errors.experience?.message} />
        </div>

        {/* Affiliation */}
        <div className="flex flex-col gap-3">
          <FormLabel>소속</FormLabel>
          <FormInput type="text" placeholder="소속을 입력해주세요" {...register('affiliation')} />
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
