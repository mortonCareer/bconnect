/**
 * @figma-scaffold 쇼케이스 — FileField/FileInput 컴포넌트 검수용, 디자인 N/A (#586)
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, FileField, FileInput, Form, type FileValue } from '@bconnect/ui'

const demoSchema = z.object({
  files: z
    .custom<FileValue | FileValue[] | null>()
    .refine((v) => v != null && (!Array.isArray(v) || v.length > 0), '파일을 첨부해주세요.'),
})

export default function FileFieldDetailPage() {
  const [single, setSingle] = useState<FileValue | FileValue[] | null>(null)
  const [multi, setMulti] = useState<FileValue | FileValue[] | null>([])
  const form = useForm<z.infer<typeof demoSchema>>({
    resolver: zodResolver(demoSchema),
    defaultValues: { files: null },
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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">FileField / FileInput</h1>
          <p className="mb-8 text-gray-600">
            파일(문서) 업로드 공통 컴포넌트. 빈 상태는 outline 트리거, 선택 후 파일명 칩으로 치환.
            폼은 FileField(RHF), 제어 상태는 FileInput. 실제 업로드는 호출부(제출)가 담당.
          </p>

          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">폼 (FileField + RHF)</h2>
            <p className="mb-3 text-sm text-gray-500">
              빈 채로 “제출”하면 zod 검증 에러(빨간 테두리 + 메시지)가, 10MB 초과 파일을 올리면 파일
              검증 에러가 뜹니다.
            </p>
            <div className="rounded-lg border p-6">
              <Form {...form}>
                <form onSubmit={onSubmit} className="flex flex-col gap-3">
                  <FileField
                    control={form.control}
                    name="files"
                    label="증빙 파일"
                    hint="이미지 또는 PDF, 개당 10MB 이하"
                    required
                  />
                  <Button type="submit" variant="primary" size="sm" className="self-start">
                    제출 (검증)
                  </Button>
                </form>
              </Form>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">단일 (single)</h2>
            <div className="rounded-lg border p-6">
              <FileInput value={single} onChange={setSingle} />
            </div>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">다중 (multiple)</h2>
            <div className="rounded-lg border p-6">
              <FileInput value={multi} onChange={setMulti} multiple maxFiles={3} />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { FileField, FileInput } from '@bconnect/ui'

// 폼 (react-hook-form)
<FileField control={form.control} name="files" />
<FileField control={form.control} name="files" multiple maxFiles={3} />

// 제어 상태 (필터 등 폼 밖)
<FileInput value={value} onChange={setValue} />`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
