'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useQueryClient,
  useGetCurrentMember,
  useGetMyProfile,
  useUpdateMember,
  useUpdateMyProfile,
  getGetCurrentMemberQueryKey,
  getGetMyProfileQueryKey,
  Trade,
} from '@morton/api-client'
import { TopBar, Input, Tag } from '@morton/ui'
import { TRADE_LABELS, TRADE_GROUPS } from '@/lib/trade-labels'
import { profileEditSchema, type ProfileEditFormData } from './schema'

export default function ProfileEditPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: member, isLoading: isMemberLoading } = useGetCurrentMember()
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfile()

  const updateMemberMutation = useUpdateMember()
  const updateProfileMutation = useUpdateMyProfile()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
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
  const isSaving = isSubmitting || updateMemberMutation.isPending || updateProfileMutation.isPending

  const onSubmit = async (data: ProfileEditFormData) => {
    try {
      const promises: Promise<unknown>[] = []

      // Member 업데이트 (name)
      if (member?.id && data.name !== member.name) {
        promises.push(
          updateMemberMutation.mutateAsync({
            memberId: member.id,
            data: { name: data.name },
          })
        )
      }

      // Profile 업데이트
      promises.push(
        updateProfileMutation.mutateAsync({
          data: {
            primaryTrade: data.primaryTrade as Trade | undefined,
            trades: data.trades as Trade[] | undefined,
            experience: data.experience,
            headline: data.headline ?? undefined,
            about: data.about ?? undefined,
            address: data.city ? { city: data.city } : undefined,
          },
        })
      )

      await Promise.all(promises)

      // 캐시 무효화
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetCurrentMemberQueryKey() }),
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
        <Controller
          name="trades"
          control={control}
          render={({ field: tradesField }) => {
            const selectedTrades = tradesField.value ?? []
            if (selectedTrades.length === 0) return <></>

            return (
              <div className="flex flex-col gap-[8px]">
                <label className="text-m-16 text-morton-gray-900">
                  대표분야 <span className="text-morton-error">*</span>
                </label>
                <Controller
                  name="primaryTrade"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-[8px]">
                      {selectedTrades.map((tradeValue: string) => {
                        const isPrimary = field.value === tradeValue
                        return (
                          <Tag
                            key={tradeValue}
                            variant={isPrimary ? 'selected' : 'default'}
                            onClick={() => field.onChange(tradeValue)}
                          >
                            {TRADE_LABELS[tradeValue as Trade]}
                          </Tag>
                        )
                      })}
                    </div>
                  )}
                />
              </div>
            )
          }}
        />

        {/* 경력 */}
        <div className="flex flex-col gap-[8px]">
          <label className="text-m-16 text-morton-gray-900">
            경력 <span className="text-morton-error">*</span>
          </label>
          <Input
            type="number"
            placeholder="내용을 입력해주세요"
            variant={errors.experience ? 'error' : 'default'}
            errorMessage={errors.experience?.message}
            {...register('experience', {
              setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
            })}
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
