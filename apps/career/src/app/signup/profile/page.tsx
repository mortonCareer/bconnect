/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=643-8028
 */
'use client'

import { AddressField } from '@/components/AddressField'
import { ROLE_LABELS, SIGNUP_ROLES } from '@/lib/role-labels'
import { useAuthStore } from '@/stores/auth-store'
import { useSignupStore } from '@/stores/signup-store'
import { Role, Trade, TRADE_LABELS, useCreateMember, useCreateProfile } from '@bconnect/api-client'
import type { RegisterMemberResponse } from '@bconnect/api-client'
import { mapKakaoAddress } from '@bconnect/config/address'
import {
  Form,
  FormControl,
  FormError,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSubmitButton,
  NumberField,
  passthroughError,
  SelectField,
  Tag,
  TextField,
  useScrollToError,
  useServerError,
} from '@bconnect/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { SignupHeader } from '../_components/SignupHeader'
import { TradeSelector } from './_components/TradeSelector'
import { MAX_TRADES, profileSchema, type ProfileFormData } from './schema'

function requireRegisterAccessToken(result: RegisterMemberResponse) {
  // TODO: BE required 처리 후 type narrowing 필요.
  // RegisterMemberResponse.accessToken은 세션 필수값인데 optional emit이다.
  if (!result.accessToken) {
    throw new Error('회원가입 세션 토큰이 응답에 없습니다.')
  }

  return result.accessToken
}

export default function SignupProfilePage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const { formData } = useSignupStore()
  // register(POST /members)는 X-Signup-Token 헤더로 인증한다 (Bearer 아님).
  const registerMemberMutation = useCreateMember({
    request: { headers: { 'X-Signup-Token': formData.signupToken } },
  })
  const createProfileMutation = useCreateProfile()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: {
      name: formData.name || '',
      fields: formData.fields || [],
      primaryField: formData.primaryField || undefined,
      experience: formData.experience ?? undefined,
      role: undefined,
      address: undefined,
      headline: '',
    },
  })
  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = form

  const server = useServerError(
    control,
    passthroughError<ProfileFormData>(undefined, '회원가입에 실패했습니다. 다시 시도해주세요.')
  )
  const [issuedAccessToken, setIssuedAccessToken] = useState<string | null>(null)

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

  const scrollToError = useScrollToError()

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // register 는 signupToken(X-Signup-Token 헤더)을 소비 — 실패 후 재시도 시
      // 재호출하지 않도록 발급된 accessToken을 보관한다.
      // 회원 가입 유형은 auth 레벨 Role.USER 고정
      // (시공 유형은 ProfileRole 로 프로필에 저장).
      const accessToken =
        issuedAccessToken ??
        requireRegisterAccessToken(
          await registerMemberMutation.mutateAsync({
            data: {
              username: formData.username,
              name: data.name,
              role: Role.USER,
            },
          })
        )

      if (!issuedAccessToken) {
        setIssuedAccessToken(accessToken)
      }

      login(accessToken)
      await createProfileMutation.mutateAsync({
        data: {
          role: data.role,
          primaryTrade: data.primaryField as Trade,
          trades: data.fields as Trade[],
          experience: data.experience,
          headline: data.headline || undefined,
          address: data.address ?? mapKakaoAddress(null),
        },
      })

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
        <form
          onSubmit={handleSubmit(onSubmit, scrollToError)}
          className="flex min-h-0 flex-1 flex-col"
        >
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
            <NumberField
              control={control}
              name="experience"
              label="경력"
              required
              maxLength={2}
              placeholder="경력을 입력해주세요 (년)"
            />

            {/* 유형 */}
            <FormField
              control={control}
              name="role"
              render={({ field }) => (
                <FormItem className="gap-2">
                  <FormLabel required>유형</FormLabel>
                  <FormControl>
                    <div tabIndex={-1} className="flex flex-wrap gap-2 outline-none">
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
                  </FormControl>
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
          <div className="bg-white p-4">
            <FormSubmitButton
              requireAllFilled={false}
              variant="primary"
              size="full"
              isLoading={
                isSubmitting || registerMemberMutation.isPending || createProfileMutation.isPending
              }
            >
              완료
            </FormSubmitButton>
          </div>
        </form>
      </Form>
    </div>
  )
}
