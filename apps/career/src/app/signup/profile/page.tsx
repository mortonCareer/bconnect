/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=643-8028
 */
'use client'

import { AddressField } from '@/components/AddressField'
import type { ExperienceLevel } from '@/lib/experience'
import { EXPERIENCE_OPTIONS, EXPERIENCE_TO_YEARS } from '@/lib/experience'
import { ROLE_LABELS, SIGNUP_ROLES } from '@/lib/role-labels'
import { useAuthStore } from '@/stores/auth-store'
import { useSignupStore } from '@/stores/signup-store'
import { Trade, TRADE_LABELS, useCreateProfile, useRegisterMember } from '@bconnect/api-client'
import { mapKakaoAddress } from '@bconnect/config/address'
import {
  Form,
  FormError,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSubmitButton,
  SelectField,
  Tag,
  TextField,
  passthroughError,
  useServerError,
} from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { SignupHeader } from '../_components/SignupHeader'
import { TradeSelector } from './_components/TradeSelector'
import { MAX_TRADES, profileSchema, type ProfileFormData } from './schema'

export default function SignupProfilePage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const registerMemberMutation = useRegisterMember()
  const createProfileMutation = useCreateProfile()
  const { formData } = useSignupStore()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: {
      name: formData.name || '',
      fields: formData.fields || [],
      primaryField: formData.primaryField || undefined,
      experience: formData.experience || undefined,
      affiliation: formData.affiliation || '',
      role: undefined,
      address: undefined,
      headline: '',
    },
  })
  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting, isValid },
  } = form

  const server = useServerError(
    control,
    passthroughError<ProfileFormData>(undefined, '회원가입에 실패했습니다. 다시 시도해주세요.')
  )
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

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // registerMember 는 signupToken 을 소비 — 실패 후 재시도 시 재호출하지 않도록 가드.
      if (!registered) {
        const result = await registerMemberMutation.mutateAsync({
          data: {
            signupToken: formData.signupToken,
            username: formData.username,
            name: data.name,
            picture: '',
            role: data.role,
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
          address: data.address ?? mapKakaoAddress(null),
        },
      })

      useSignupStore.getState().reset()
      router.push('/signup/complete')
    } catch (err) {
      server.capture(err, data)
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <SignupHeader step={3} onBack={() => router.back()} />

      {/* Content */}
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-6 pt-3">
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
            <TradeSelector control={control} name="fields" max={MAX_TRADES} />

            {/* 대표분야 */}
            <SelectField
              control={control}
              name="primaryField"
              label="대표분야"
              required
              fitContent
              disabled={selectedFields.length === 0}
              placeholder="선택해주세요"
              options={selectedFields.map((trade) => ({
                value: trade,
                label: TRADE_LABELS[trade as Trade],
              }))}
            />

            {/* 경력 */}
            <FormField
              control={control}
              name="experience"
              render={({ field }) => (
                <FormItem className="gap-3">
                  <FormLabel required>경력</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

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
            <FormField
              control={control}
              name="role"
              render={({ field }) => (
                <FormItem className="gap-2">
                  <FormLabel required>유형</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {SIGNUP_ROLES.map((role) => (
                      <Tag
                        key={role}
                        variant={field.value === role ? 'selected' : 'default'}
                        onClick={() => field.onChange(role)}
                      >
                        {ROLE_LABELS[role]}
                      </Tag>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 주소 */}
            <AddressField
              control={control}
              name="address"
              label="주소"
              description="정확한 매칭을 위해 일하는 곳을 기준으로 입력해주세요"
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
            <FormError error={server.formError} />
          </div>
          <div className="bg-white px-4 pb-8 pt-4">
            <FormSubmitButton
              requireAllFilled={false}
              variant="primary"
              size="full"
              disabled={!isValid}
              isLoading={isSubmitting || registerMemberMutation.isPending}
            >
              완료
            </FormSubmitButton>
          </div>
        </form>
      </Form>
    </div>
  )
}
