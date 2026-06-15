'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Credential } from '@bconnect/api-client'
import { Form, FormSubmitButton, TextField, toast } from '@bconnect/ui'
import { formatRegistrationNumber, registrationNumberSchema } from '@bconnect/config/biz-number'
import { CredentialList } from '@/app/(main)/profile/certifications/_components/CredentialList'

interface OneClickTabProps {
  credentials: Credential[]
  onRequestDelete: (id: number) => void
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

const ONE_CLICK_TYPES = [
  'IDENTITY_VERIFICATION',
  'SOLE_PROPRIETOR',
  'CONSTRUCTION_LICENSE',
  'SPECIALTY_CONSTRUCTION_LICENSE',
] as const

/** 개업일자 마스킹 (YYYY-MM-DD). 8자리 초과 입력은 잘림. */
const formatOpenDate = (value: string): string => {
  const d = value.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 4) return d
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`
}

const oneClickSchema = z.object({
  businessNumber: registrationNumberSchema,
  ownerName: z.string().trim().min(1, '대표자 성명을 입력해주세요'),
  openDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '개업일자를 YYYY-MM-DD 형식으로 입력해주세요')
    .refine((v) => !Number.isNaN(Date.parse(v)), '올바른 날짜가 아니에요'),
})

type OneClickInput = z.input<typeof oneClickSchema>
type OneClickOutput = z.output<typeof oneClickSchema>

export function OneClickTab({
  credentials,
  onRequestDelete,
  isLoading,
  isError,
  onRetry,
}: OneClickTabProps) {
  const [isSearching, setIsSearching] = useState(false)

  const form = useForm<OneClickInput, unknown, OneClickOutput>({
    resolver: zodResolver(oneClickSchema),
    mode: 'onTouched',
    defaultValues: { businessNumber: '', ownerName: '', openDate: '' },
  })
  const { isValid } = form.formState

  const oneClickCredentials = credentials.filter(
    (c) => c.type && (ONE_CLICK_TYPES as readonly string[]).includes(c.type)
  )

  const onSearch = form.handleSubmit(() => {
    setIsSearching(true)
    // TODO: 진위확인 + 조회 연동 (기존 /one-click 로직 재활용). businessNumber 는 digit-only.
    //   1) POST /api/one-click/verify-owner (번호+대표자명+개업일자) → valid 확인
    //   2) getCompanyInfo(번호) 조회 — server-only 라 API route 신설 후 호출
    //   3) 일치 시 사업자/면허 createCredential 등록
    setTimeout(() => {
      setIsSearching(false)
      toast({ description: '면허 정보가 갱신되었어요', variant: 'success' })
    }, 1000)
  })

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 px-4 py-4">
        <p className="text-r-12 text-gray-500">사업자 및 면허 정보를 한 번에 인증하세요.</p>

        <Form {...form}>
          <form onSubmit={onSearch} className="flex flex-col gap-3">
            <TextField
              control={form.control}
              name="businessNumber"
              label="사업자등록번호"
              required
              placeholder="000-00-00000"
              inputMode="numeric"
              transform={formatRegistrationNumber}
            />
            <TextField
              control={form.control}
              name="ownerName"
              label="대표자 성명"
              required
              placeholder="홍길동"
            />
            <TextField
              control={form.control}
              name="openDate"
              label="개업일자"
              required
              placeholder="0000-00-00"
              inputMode="numeric"
              transform={formatOpenDate}
            />

            <FormSubmitButton
              variant="primary"
              size="full"
              requireAllFilled={false}
              disabled={!isValid}
              isLoading={isSearching}
            >
              조회하기
            </FormSubmitButton>
          </form>
        </Form>
      </div>

      {/* 하단 인증 목록 */}
      <CredentialList
        credentials={oneClickCredentials}
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        onRequestDelete={onRequestDelete}
        emptyText="아직 인증된 정보가 없어요"
      />
    </div>
  )
}
