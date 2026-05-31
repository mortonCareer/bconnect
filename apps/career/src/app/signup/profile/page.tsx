/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=643-8028
 */
'use client'

import type { ExperienceLevel } from '@/lib/experience'
import { EXPERIENCE_OPTIONS, EXPERIENCE_TO_YEARS } from '@/lib/experience'
import { ROLE_LABELS, SIGNUP_ROLES } from '@/lib/role-labels'
import { TRADE_GROUPS, TRADE_LABELS } from '@/lib/trade-labels'
import { useAuthStore } from '@/stores/auth-store'
import { useSignupStore } from '@/stores/signup-store'
import { Role, Trade, useCreateProfile, useRegisterMember } from '@bconnect/api-client'
import {
  Button,
  Form,
  FormDescription,
  FormError,
  Tag,
  TextField,
  isApiErrorShape,
  passthroughError,
  useServerError,
} from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { FormLabel, SignupHeader } from '../_components'
import { MAX_TRADES, profileSchema, type ProfileFormData } from './schema'

export default function SignupProfilePage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const registerMemberMutation = useRegisterMember()
  const createProfileMutation = useCreateProfile()
  const { formData } = useSignupStore()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      name: formData.name || '',
      fields: formData.fields || [],
      primaryField: formData.primaryField || undefined,
      experience: formData.experience || undefined,
      affiliation: formData.affiliation || '',
      role: undefined,
      address: '',
      headline: '',
    },
  })
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = form

  const server = useServerError(control, (err) => {
    if (isApiErrorShape(err)) {
      if (err.code === 'A009')
        return { message: '유효하지 않은 가입 토큰입니다. 다시 로그인해주세요.' }
      if (err.code === 'A010')
        return { message: '가입 토큰이 만료되었습니다. 다시 로그인해주세요.' }
    }
    return passthroughError<ProfileFormData>(
      undefined,
      '회원가입에 실패했습니다. 다시 시도해주세요.'
    )(err)
  })
  const [registered, setRegistered] = useState(false)

  const watchedFields = useWatch({ control, name: 'fields' })
  const watchedPrimaryField = useWatch({ control, name: 'primaryField' })

  const selectedFields = watchedFields || []

  // 시공분야 선택 시 대표분야 자동 설정
  useEffect(() => {
    if (
      watchedFields &&
      watchedFields.length > 0 &&
      !watchedFields.includes(watchedPrimaryField as string)
    ) {
      setValue('primaryField', watchedFields[0])
    }
  }, [watchedFields, watchedPrimaryField, setValue])

  const toggleField = (trade: Trade) => {
    const currentFields = selectedFields || []
    if (currentFields.includes(trade)) {
      setValue(
        'fields',
        currentFields.filter((f) => f !== trade),
        { shouldValidate: true }
      )
    } else if (currentFields.length < MAX_TRADES) {
      setValue('fields', [...currentFields, trade], { shouldValidate: true })
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // registerMember 는 signupToken 을 소비 — 실패 후 재시도 시 재호출하지 않도록 가드.
      if (!registered) {
        const selectedRole = (data.role as Role) || Role.SKILLED
        const result = await registerMemberMutation.mutateAsync({
          data: {
            signupToken: formData.signupToken,
            username: formData.username,
            name: data.name,
            picture: '',
            role: selectedRole,
          },
        })
        login(result.accessToken)
        setRegistered(true)
      }

      await createProfileMutation.mutateAsync({
        data: {
          primaryTrade: data.primaryField as Trade,
          trades: data.fields as Trade[],
          experience: EXPERIENCE_TO_YEARS[data.experience],
          headline: data.headline || undefined,
          // TODO #280 — 카카오 우편번호 도입 전 임시 mock 값. zipcode/state/lat/lng 0 으로
          // address 는 BE-required 라 undefined 불가 — 비어있으면 empty city 로 (BE validation 위임)
          address: {
            zipcode: '',
            city: data.address || '',
            state: '',
            street: data.address || '',
            latitude: 0,
            longitude: 0,
          },
        },
      })

      useSignupStore.getState().reset()
      router.push('/signup/complete')
    } catch (err) {
      server.capture(err, data)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SignupHeader step={3} onBack={() => router.back()} />

      {/* Content */}
      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-28 pt-3"
        >
          <h1 className="text-sb-24 text-black">
            기술자님의 시공분야와
            <br />
            역할을 선택해주세요
          </h1>

          {/* 이름 */}
          <TextField
            control={control}
            name="name"
            type="text"
            label="이름"
            required
            placeholder="이름을 입력해주세요"
          />

          {/* 시공분야 */}
          <div className="flex flex-col gap-3">
            <FormLabel required>시공분야</FormLabel>
            <FormDescription>
              최대 {MAX_TRADES}개까지 선택 가능해요 ({selectedFields.length}/{MAX_TRADES})
            </FormDescription>
            {TRADE_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-3">
                <p className="text-m-14 text-gray-700">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.trades.map((trade) => (
                    <Tag
                      key={trade}
                      variant={selectedFields.includes(trade) ? 'selected' : 'default'}
                      onClick={() => toggleField(trade)}
                    >
                      {TRADE_LABELS[trade]}
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
            <FormError error={errors.fields?.message} />
          </div>

          {/* 대표분야 */}
          {/* TODO: 별도 SelectField로 대체 */}
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
                      className="flex h-[40px] appearance-none items-center rounded-[8px] border border-gray-300 bg-white py-[3px] pl-[10px] pr-8 text-m-14 text-gray-900"
                    >
                      {selectedFields.map((tradeValue) => (
                        <option key={tradeValue} value={tradeValue}>
                          {TRADE_LABELS[tradeValue as Trade]}
                        </option>
                      ))}
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

          {/* 경력 */}
          <div className="flex flex-col gap-3">
            <FormLabel required>경력</FormLabel>
            <Controller
              name="experience"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <Tag
                      key={option.id}
                      variant={field.value === option.id ? 'selected' : 'default'}
                      onClick={() => field.onChange(option.id as ExperienceLevel)}
                    >
                      {option.label}
                    </Tag>
                  ))}
                </div>
              )}
            />
            <FormError error={errors.experience?.message} />
          </div>

          {/* 소속 */}
          <TextField
            control={control}
            name="affiliation"
            type="text"
            label="소속"
            required
            placeholder="소속을 입력해주세요"
          />

          {/* 유형 */}
          <div className="flex flex-col gap-2">
            <FormLabel>유형</FormLabel>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {SIGNUP_ROLES.map((role) => (
                    <Tag
                      key={role}
                      variant={field.value === role ? 'selected' : 'default'}
                      onClick={() => field.onChange(field.value === role ? undefined : role)}
                    >
                      {ROLE_LABELS[role]}
                    </Tag>
                  ))}
                </div>
              )}
            />
          </div>

          {/* 주소 */}
          <TextField
            control={control}
            name="address"
            type="text"
            label="주소"
            description="정확한 매칭을 위해 일하는 곳을 기준으로 입력해주세요"
            placeholder="주소를 입력해주세요"
          />

          {/* 한줄소개 */}
          <TextField
            control={control}
            name="headline"
            type="text"
            label="한줄소개"
            maxLength={20}
            placeholder="한줄소개를 입력해주세요 (최대 20글자)"
          />
        </form>

        {/* Fixed Submit Button */}
        <div className="fixed inset-x-0 bottom-0 bg-white px-4 pb-[env(safe-area-inset-bottom,32px)] pt-4">
          <FormError error={server.formError} className="mb-2" />
          <Button
            type="submit"
            variant="primary"
            size="full"
            disabled={!isValid}
            isLoading={isSubmitting || registerMemberMutation.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            완료
          </Button>
        </div>
      </Form>
    </div>
  )
}
