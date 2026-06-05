/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1235-4100
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useQueryClient,
  useGetMyMember,
  useGetMyProfile,
  useUpdateMyMember,
  useUpdateMyProfile,
  useUpdateMyProfileAbout,
  getGetMyMemberQueryKey,
  getGetMyProfileQueryKey,
  Trade,
} from '@bconnect/api-client'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  SelectField,
  Tag,
  TextareaField,
  TextField,
  TopBar,
  useScrollToError,
} from '@bconnect/ui'
import { TRADE_LABELS, TRADE_GROUPS } from '@bconnect/api-client'
import { profileEditSchema, type ProfileEditFormData } from './schema'

const EXPERIENCE_OPTIONS = [
  { id: 'newcomer', label: '신입', years: 0 },
  { id: '1-3', label: '1~3년', years: 2 },
  { id: '3-5', label: '3~5년', years: 4 },
  { id: '5-10', label: '5~10년', years: 7 },
  { id: '10+', label: '10년 이상', years: 15 },
] as const

function yearsToLevel(years: number | undefined): string | undefined {
  if (years == null) return undefined
  if (years === 0) return 'newcomer'
  if (years <= 3) return '1-3'
  if (years <= 5) return '3-5'
  if (years <= 10) return '5-10'
  return '10+'
}

function levelToYears(level: string): number {
  return EXPERIENCE_OPTIONS.find((o) => o.id === level)?.years ?? 0
}

export default function ProfileEditPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: member, isLoading: isMemberLoading } = useGetMyMember()
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfile()

  const updateMemberMutation = useUpdateMyMember()
  const updateProfileMutation = useUpdateMyProfile()
  const updateAboutMutation = useUpdateMyProfileAbout()

  const form = useForm<ProfileEditFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zod v4 + @hookform/resolvers 타입 호환 workaround
    resolver: zodResolver(profileEditSchema as any),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      phone: '',
      primaryTrade: undefined,
      trades: [],
      experience: undefined,
      headline: '',
      about: '',
      city: '',
    },
  })
  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { isSubmitting },
  } = form

  // 데이터 로드 후 폼 초기값 설정
  useEffect(() => {
    if (member || profile) {
      reset({
        name: member?.name ?? '',
        phone: member?.phone ?? '',
        primaryTrade: profile?.primaryTrade ?? undefined,
        trades: profile?.trades ?? [],
        experience: profile?.experience ?? undefined,
        headline: profile?.headline ?? '',
        about: profile?.about ?? '',
        city: profile?.address?.city ?? '',
      })
    }
  }, [member, profile, reset])

  const watchedTrades = useWatch({ control, name: 'trades' })
  const watchedPrimaryTrade = useWatch({ control, name: 'primaryTrade' })

  const isLoading = isMemberLoading || isProfileLoading
  const isSaving =
    isSubmitting ||
    updateMemberMutation.isPending ||
    updateProfileMutation.isPending ||
    updateAboutMutation.isPending

  const scrollToError = useScrollToError()

  const onSubmit = async (data: ProfileEditFormData) => {
    try {
      const promises: Promise<unknown>[] = []

      // Member 업데이트 (name)
      if (member?.id && data.name !== member.name) {
        promises.push(
          updateMemberMutation.mutateAsync({
            data: { name: data.name, role: member.role! },
          })
        )
      }

      // Profile 업데이트
      promises.push(
        updateProfileMutation.mutateAsync({
          data: {
            primaryTrade: data.primaryTrade as Trade,
            trades: data.trades as Trade[],
            experience: data.experience,
            headline: data.headline || undefined,
            // TODO #280 — 카카오 우편번호 도입 전 임시 mock 값. zipcode/state/lat/lng 0 으로
            address: {
              zipcode: '',
              city: data.city || '',
              state: '',
              street: data.city || '',
              latitude: 0,
              longitude: 0,
            },
          },
        })
      )

      // About 별도 업데이트
      if (data.about != null) {
        promises.push(
          updateAboutMutation.mutateAsync({
            data: { about: data.about || undefined },
          })
        )
      }

      await Promise.all(promises)

      // 캐시 무효화
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetMyMemberQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() }),
      ])

      router.back()
    } catch (err) {
      console.error('프로필 수정 실패:', err)
    }
  }

  const toggleTrade = (tradeValue: string) => {
    const currentTrades = watchedTrades ?? []
    if (currentTrades.includes(tradeValue)) {
      const updated = currentTrades.filter((t: string) => t !== tradeValue)
      setValue('trades', updated, { shouldValidate: true })
      // 대표분야가 제거되면 첫번째로 변경
      if (watchedPrimaryTrade === tradeValue) {
        setValue('primaryTrade', updated[0] ?? undefined, { shouldValidate: true })
      }
    } else if (currentTrades.length < 3) {
      const updated = [...currentTrades, tradeValue]
      setValue('trades', updated, { shouldValidate: true })
      // 대표분야 미설정 시 자동 설정
      if (!watchedPrimaryTrade) {
        setValue('primaryTrade', tradeValue, { shouldValidate: true })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <TopBar
          variant="default"
          title="프로필 수정"
          showAction={false}
          onBack={() => router.back()}
        />
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopBar
        variant="default"
        title="프로필 수정"
        actionLabel={isSaving ? '저장 중...' : '완료'}
        onAction={handleSubmit(onSubmit, scrollToError)}
        onBack={() => router.back()}
      />

      <Form {...form}>
        <form className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-24 pt-3">
          {/* 이름 */}
          <TextField
            control={control}
            name="name"
            label="이름"
            required
            placeholder="이름을 입력해주세요"
          />

          {/* 시공분야 */}
          <FormField
            control={control}
            name="trades"
            render={({ field }) => (
              <FormItem className="gap-3">
                <FormLabel required className="text-m-16 text-gray-900">
                  시공분야
                </FormLabel>
                <FormControl>
                  <div tabIndex={-1} className="flex flex-col gap-3 outline-none">
                    {TRADE_GROUPS.map((group) => (
                      <div key={group.label} className="flex flex-col gap-3">
                        <p className="text-m-14 text-gray-700">{group.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.trades.map((tradeValue) => {
                            const isSelected = field.value?.includes(tradeValue) ?? false
                            return (
                              <Tag
                                key={tradeValue}
                                variant={isSelected ? 'selected' : 'default'}
                                onClick={() => toggleTrade(tradeValue)}
                              >
                                {TRADE_LABELS[tradeValue]}
                              </Tag>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 대표분야 */}
          {(watchedTrades ?? []).length > 0 && (
            <SelectField
              control={control}
              name="primaryTrade"
              label="대표분야"
              required
              options={(watchedTrades ?? []).map((trade) => ({
                value: trade,
                label: TRADE_LABELS[trade as Trade],
              }))}
            />
          )}

          {/* 경력 — 선택형(#427 슬라이더 전환 예정), 텍스트 *Field 대상 아님 */}
          <FormField
            control={control}
            name="experience"
            render={({ field }) => (
              <FormItem className="gap-2">
                <FormLabel required className="text-m-16 text-gray-900">
                  경력
                </FormLabel>
                <FormControl>
                  <div tabIndex={-1} className="flex flex-wrap items-center gap-2 outline-none">
                    {EXPERIENCE_OPTIONS.map((option) => {
                      const isSelected = yearsToLevel(field.value) === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => field.onChange(levelToYears(option.id))}
                          className={`flex h-10 items-center justify-center rounded-lg border px-3.5 py-[3px] text-sm leading-[1.6] transition-colors ${
                            isSelected
                              ? 'border-primary bg-secondary font-semibold text-primary'
                              : 'border-gray-300 font-medium text-gray-500'
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 한줄소개 */}
          <TextField
            control={control}
            name="headline"
            label="한줄소개"
            placeholder="한줄소개를 입력해주세요 (최대 20글자)"
          />

          {/* 소개 */}
          <TextareaField
            control={control}
            name="about"
            label="소개"
            rows={4}
            placeholder="자기소개를 입력해주세요"
          />

          {/* 주소 */}
          <TextField
            control={control}
            name="city"
            label="주소"
            description="정확한 매칭을 위해 일하는 곳을 기준으로 입력해주세요"
            placeholder="주소를 입력해주세요"
          />
        </form>
      </Form>
    </div>
  )
}
