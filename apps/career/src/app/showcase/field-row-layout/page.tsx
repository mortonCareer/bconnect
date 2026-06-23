/**
 * @figma-scaffold 쇼케이스 — *Field row layout + DateRangeField/TagSelectField 검수용 (#581)
 */
'use client'

import { Trade, TRADE_LIST } from '@bconnect/api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  DateRangeField,
  Form,
  FormSubmitButton,
  TagSelectField,
  TextField,
  TextareaField,
} from '@bconnect/ui'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const demoSchema = z
  .object({
    corpName: z.string().min(1, '업체명을 입력해주세요.'),
    startDate: z.string().min(1, '시작일을 선택해주세요.'),
    endDate: z.string().min(1, '종료일을 선택해주세요.'),
    address: z.string().min(1, '현장주소를 입력해주세요.'),
    addressDetail: z.string(),
    trades: z.array(z.nativeEnum(Trade)).min(1, '공종을 1개 이상 선택해주세요.'),
    request: z.string(),
    memo: z.string(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
    message: '종료일은 시작일 이후여야 해요.',
    path: ['endDate'],
  })

type DemoValues = z.infer<typeof demoSchema>

export default function FieldRowLayoutShowcasePage() {
  const form = useForm<DemoValues>({
    resolver: zodResolver(demoSchema),
    mode: 'onTouched',
    defaultValues: {
      corpName: '서정 건축',
      startDate: '',
      endDate: '',
      address: '경기도 수원시 율전로 00번길 00-00',
      addressDetail: '000호',
      trades: [Trade.TILING, Trade.WALLPAPER],
      request: '타일 시공 및 단일 벽면 일부 도배',
      memo: '세밀한 작업이 필요함',
    },
  })
  const onSubmit = form.handleSubmit(() => window.alert('제출 성공'))

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/showcase"
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-primary"
        >
          ← 컴포넌트 목록
        </Link>

        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">*Field layout=&quot;row&quot;</h1>
          <p className="mb-8 text-gray-600">
            작업 생성/편집 패널(#582)용 수평 필드. 라벨 좌측 고정폭 + 하단 구분선, 입력은 값
            텍스트처럼 보임. 빈 날짜/공종 전부 제거 후 제출하면 에러가 값 컬럼에 표시됩니다.
          </p>

          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">row 레이아웃 (패널형)</h2>
            <div className="max-w-[393px] rounded-lg border p-4">
              <Form {...form}>
                <form onSubmit={onSubmit} className="flex flex-col">
                  <TextField control={form.control} name="corpName" label="업체명" layout="row" />
                  <DateRangeField
                    control={form.control}
                    startName="startDate"
                    endName="endDate"
                    label="작업기간"
                    layout="row"
                  />
                  <TextField control={form.control} name="address" label="현장주소" layout="row" />
                  <TextField
                    control={form.control}
                    name="addressDetail"
                    label="상세주소"
                    layout="row"
                  />
                  <TagSelectField
                    control={form.control}
                    name="trades"
                    options={TRADE_LIST}
                    label="공종"
                    layout="row"
                  />
                  <TextField control={form.control} name="request" label="요청사항" layout="row" />
                  <TextareaField control={form.control} name="memo" label="메모" layout="row" />
                  <p className="mt-2 text-r-12 text-gray-500">
                    * 작성된 메모는 기술자에게 공개되지 않아요
                  </p>
                  <FormSubmitButton className="mt-6" requireAllFilled={false}>
                    제출
                  </FormSubmitButton>
                </form>
              </Form>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              stacked 레이아웃 (기존 기본값 회귀 확인)
            </h2>
            <div className="rounded-lg border p-6">
              <Form {...form}>
                <div className="flex flex-col gap-5">
                  <TextField control={form.control} name="corpName" label="업체명" required />
                  <DateRangeField
                    control={form.control}
                    startName="startDate"
                    endName="endDate"
                    label="작업기간"
                  />
                  <TagSelectField
                    control={form.control}
                    name="trades"
                    options={TRADE_LIST}
                    label="공종"
                  />
                </div>
              </Form>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
