/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1235-4100
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch, Controller } from 'react-hook-form'
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
import { TopBar, Input, Tag } from '@bconnect/ui'
import { TRADE_LABELS, TRADE_GROUPS } from '@/lib/trade-labels'
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

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileEditFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zod v4 + @hookform/resolvers 타입 호환 workaround
    resolver: zodResolver(profileEditSchema as any),
    mode: 'onChange',
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
          <p className="text-m-14 text-morton-gray-500">로딩 중...</p>
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
        onAction={handleSubmit(onSubmit)}
        onBack={() => router.back()}
      />

      <form className="flex flex-1 flex-col gap-[24px] overflow-y-auto px-4 pb-24 pt-3">
        {/* 이름 */}
        <div className="flex flex-col gap-[8px]">
          <label className="text-m-16 text-morton-gray-900">
            이름 <span className="text-morton-error">*</span>
          </label>
          <Input
            placeholder="내용을 입력해주세요"
            variant={errors.name ? 'error' : 'default'}
            errorMessage={errors.name?.message}
            {...register('name')}
          />
        </div>

        {/* 시공분야 */}
        <div className="flex flex-col gap-[12px]">
          <label className="text-m-16 text-morton-gray-900">
            시공분야 <span className="text-morton-error">*</span>
          </label>
          <Controller
            name="trades"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-[12px]">
                {TRADE_GROUPS.map((group) => (
                  <div key={group.label} className="flex flex-col gap-[12px]">
                    <p className="text-m-14 text-morton-gray-700">{group.label}</p>
                    <div className="flex flex-wrap gap-[8px]">
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
            )}
          />
          {errors.trades && <p className="text-sm text-morton-error">{errors.trades.message}</p>}
        </div>

        {/* 대표분야 */}
        {(watchedTrades ?? []).length > 0 && (
          <div className="flex flex-col gap-[8px]">
            <label className="text-m-16 text-morton-gray-900">
              대표분야 <span className="text-morton-error">*</span>
            </label>
            <Controller
              name="primaryTrade"
              control={control}
              render={({ field }) => (
                <div className="relative w-fit">
                  <select
                    value={field.value || ''}
                    onChange={field.onChange}
                    className="flex h-[40px] appearance-none items-center rounded-[8px] border border-morton-gray-300 bg-white py-[3px] pl-[10px] pr-8 text-m-14 text-morton-gray-900"
                  >
                    {(watchedTrades ?? []).map((tradeValue: string) => (
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
        <div className="flex flex-col gap-[8px]">
          <label className="text-m-16 text-morton-gray-900">
            경력 <span className="text-morton-error">*</span>
          </label>
          <Controller
            name="experience"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap items-center gap-2">
                {EXPERIENCE_OPTIONS.map((option) => {
                  const isSelected = yearsToLevel(field.value) === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => field.onChange(levelToYears(option.id))}
                      className={`flex h-[40px] items-center justify-center rounded-[8px] border px-[14px] py-[3px] text-sm leading-[1.6] transition-colors ${
                        isSelected
                          ? 'border-morton-primary bg-morton-primary-sub font-semibold text-morton-primary'
                          : 'border-morton-gray-300 font-medium text-morton-gray-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            )}
          />
        </div>

        {/* 한줄소개 */}
        <div className="flex flex-col gap-[8px]">
          <label className="text-m-16 text-morton-gray-900">한줄소개</label>
          <Input
            placeholder="한줄소개를 입력해주세요 (최대 20글자)"
            variant={errors.headline ? 'error' : 'default'}
            errorMessage={errors.headline?.message}
            {...register('headline')}
          />
        </div>

        {/* 소개 */}
        <div className="flex flex-col gap-[8px]">
          <label className="text-r-14 text-morton-gray-900">소개</label>
          <textarea
            placeholder="자기소개를 입력해주세요"
            rows={4}
            className="w-full resize-none rounded-lg border border-morton-gray-300 bg-transparent px-3 py-2 text-r-14 text-morton-gray-900 outline-none transition-colors placeholder:text-morton-gray-500 focus:border-morton-primary focus:ring-1 focus:ring-morton-primary disabled:pointer-events-none disabled:opacity-50"
            {...register('about')}
          />
          {errors.about && <p className="text-sm text-morton-error">{errors.about.message}</p>}
        </div>

        {/* 지역 */}
        <div className="flex flex-col gap-[8px]">
          <label className="text-m-16 text-morton-gray-900">주소</label>
          <p className="text-r-12 text-morton-gray-700">
            정확한 매칭을 위해 일하는 곳을 기준으로 입력해주세요
          </p>
          <Input
            placeholder="주소를 입력해주세요"
            variant={errors.city ? 'error' : 'default'}
            errorMessage={errors.city?.message}
            {...register('city')}
          />
        </div>
      </form>
    </div>
  )
}
