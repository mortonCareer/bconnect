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
  useGetProfile,
  useUpdateMyMember,
  useUpdateMyProfile,
  useUpdateMyProfileAbout,
  getGetMyMemberQueryKey,
  getGetProfileQueryKey,
  Trade,
  type ProfileRole,
} from '@bconnect/api-client'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  NumberField,
  SelectField,
  Tag,
  TextareaField,
  TextField,
  TopBar,
  useScrollToError,
} from '@bconnect/ui'
import { TRADE_LABELS, TRADE_GROUPS } from '@bconnect/api-client'
import { AddressField } from '@/components/AddressField'
import { mapKakaoAddress } from '@bconnect/config/address'
import { MAX_TRADES, profileEditSchema, type ProfileEditFormData } from './schema'

export default function ProfileEditPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: member, isLoading: isMemberLoading } = useGetMyMember()
  const myId = member?.id
  // 내 프로필은 useGetProfile(memberId) 로 조회 (GET /profiles/me 는 flip 으로 사라짐).
  const { data: profile, isLoading: isProfileLoading } = useGetProfile(myId!, {
    query: { enabled: myId != null },
  })

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
      address: undefined,
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
      // TODO: BE required 처리 후 type narrowing 필요. member/profile 필수 표시값이 optional emit이라 폼 초기값에서 임시 fallback 중.
      reset({
        name: member?.name ?? '',
        phone: member?.phone ?? '',
        primaryTrade: profile?.primaryTrade ?? undefined,
        trades: profile?.trades ?? [],
        experience: profile?.experience ?? undefined,
        headline: profile?.headline ?? '',
        about: profile?.about ?? '',
        address: profile?.address ?? undefined,
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

      // Member 업데이트 (name) — UpdateMemberRequest 는 { name, pictureId? } (role 없음)
      if (member?.id && data.name !== member.name) {
        promises.push(
          updateMemberMutation.mutateAsync({
            data: { name: data.name },
          })
        )
      }

      // Profile 업데이트 — role(ProfileRole) 은 편집 대상이 아니라 기존 값 유지 (필수 필드)
      promises.push(
        updateProfileMutation.mutateAsync({
          data: {
            // TODO: BE required 처리 후 type narrowing 필요. Profile.role 필수값이 optional emit이라 임시 cast로 유지.
            role: profile?.role as ProfileRole,
            primaryTrade: data.primaryTrade as Trade,
            trades: data.trades as Trade[],
            experience: data.experience,
            headline: data.headline || undefined,
            address: data.address ?? mapKakaoAddress(null),
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
      // TODO(#728): 수동 무효화 — updateMyMember→getMyMember 는 이미 config 중복(추후 제거), 내 프로필은 updateMyProfile→getProfile config 인계로 맞춰 수정 (ADR-0025)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetMyMemberQueryKey() }),
        ...(myId != null
          ? [queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey(myId) })]
          : []),
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
    } else if (currentTrades.length < MAX_TRADES) {
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
                <FormDescription>
                  최대 {MAX_TRADES}개까지 선택 가능해요 ({(watchedTrades ?? []).length}/{MAX_TRADES}
                  )
                </FormDescription>
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
          <SelectField
            control={control}
            name="primaryTrade"
            label="대표분야"
            required
            fitContent
            disabled={(watchedTrades ?? []).length === 0}
            placeholder="선택해주세요"
            options={(watchedTrades ?? []).map((trade) => ({
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
          <AddressField
            control={control}
            name="address"
            label="주소"
            description="정확한 매칭을 위해 일하는 곳을 기준으로 입력해주세요"
          />
        </form>
      </Form>
    </div>
  )
}
