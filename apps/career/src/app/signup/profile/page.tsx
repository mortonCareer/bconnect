'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@morton/ui'
import { ApiError, useRegisterMember, useUpdateMyProfile, Role, Trade } from '@morton/api-client'
import { useAuthStore } from '@/stores/auth-store'
import { useSignupStore } from '@/stores/signup-store'
import { SignupHeader, FormInput, FormLabel, FormError } from '../_components'
import { FieldSelector, ExperienceSelector } from './components'
import { FIELD_OPTIONS, FIELD_CATEGORIES, EXPERIENCE_OPTIONS } from './constants'
import { profileSchema, type ProfileFormData } from './schema'
import type { ConstructionField, ExperienceLevel } from './types'

const FIELD_TO_TRADE: Record<ConstructionField, Trade> = {
  tile: Trade.TILING,
  wallpaper: Trade.WALLPAPER,
  flooring: Trade.HARDWOOD,
  carpentry: Trade.CARPENTRY,
  demolition: Trade.DEMOLITION,
  cleaning: Trade.CLEANING,
  electrical: Trade.ELECTRICAL,
  plumbing: Trade.PLUMBING,
}

const EXPERIENCE_TO_YEARS: Record<ExperienceLevel, number> = {
  newcomer: 0,
  '1-3': 2,
  '3-5': 4,
  '5-10': 7,
  '10+': 15,
}

export default function SignupProfilePage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const registerMemberMutation = useRegisterMember()
  const updateProfileMutation = useUpdateMyProfile()
  const { formData } = useSignupStore()

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
      const result = await registerMemberMutation.mutateAsync({
        data: {
          signupToken: formData.signupToken,
          username: formData.username,
          name: data.name,
          phone: formData.phone.replace(/^\+82/, '0'),
          picture: '',
          role: Role.WORKER,
        },
      })

      // 회원가입 성공 — 로그인 처리
      login(result, '')

      // 프로필 데이터 저장 (시공분야/경력)
      await updateProfileMutation.mutateAsync({
        data: {
          primaryTrade: FIELD_TO_TRADE[data.primaryField],
          trades: data.fields.map((f) => FIELD_TO_TRADE[f]),
          experience: EXPERIENCE_TO_YEARS[data.experience],
        },
      })

      // signup store 초기화
      useSignupStore.getState().reset()

      router.push('/signup/complete')
    } catch (err) {
      if (err instanceof ApiError) {
        // 에러 처리 — 현재 페이지에서 표시
        console.error('Registration failed:', err.code, err.message)
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SignupHeader step={3} onBack={() => router.back()} />

      {/* Content */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-28 pt-3"
      >
        <h1 className="text-sb-24 text-black">
          기술자님의 시공분야와
          <br />
          역할을 선택해주세요
        </h1>

        {/* Name Input */}
        <div className="flex flex-col gap-2">
          <FormLabel required>이름</FormLabel>
          <FormInput type="text" placeholder="내용을 입력해주세요" {...register('name')} />
          <FormError message={errors.name?.message} />
        </div>

        {/* Construction Fields */}
        <div className="flex flex-col gap-3">
          <FormLabel required>시공분야</FormLabel>
          <FieldSelector
            categories={FIELD_CATEGORIES}
            selected={selectedFields}
            onToggle={toggleField}
          />
          <FormError message={errors.fields?.message} />
        </div>

        {/* Primary Field */}
        {selectedFields.length > 0 && (
          <div className="flex flex-col gap-2">
            <FormLabel required>대표분야</FormLabel>
            <Controller
              name="primaryField"
              control={control}
              render={({ field }) => (
                <div className="relative w-fit">
                  <select
                    value={field.value || ''}
                    onChange={field.onChange}
                    className="flex h-[40px] appearance-none items-center rounded-[8px] border border-morton-gray-300 bg-white py-[3px] pl-[10px] pr-8 text-m-14 text-morton-gray-900"
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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="#1B1B1B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
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
        <div className="flex flex-col gap-2">
          <FormLabel required>소속</FormLabel>
          <FormInput type="text" placeholder="내용을 입력해주세요" {...register('affiliation')} />
        </div>
      </form>

      {/* Fixed Submit Button */}
      <div className="fixed inset-x-0 bottom-0 bg-white px-4 pb-[env(safe-area-inset-bottom,32px)] pt-4">
        <Button
          type="submit"
          variant="primary"
          size="full"
          disabled={!isValid}
          isLoading={isSubmitting || registerMemberMutation.isPending}
          loadingText="저장 중..."
          onClick={handleSubmit(onSubmit)}
        >
          완료
        </Button>
      </div>
    </div>
  )
}
