/**
 * @figma-scaffold 쇼케이스 — ImageField/ImageInput 컴포넌트 검수용, 디자인 N/A (#424)
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { Form, ImageField, ImageInput, type ImageValue } from '@bconnect/ui'

export default function ImageFieldDetailPage() {
  const [single, setSingle] = useState<ImageValue | ImageValue[] | null>(null)
  const [multi, setMulti] = useState<ImageValue | ImageValue[] | null>([])
  const form = useForm<{ images: ImageValue | ImageValue[] | null }>({
    defaultValues: { images: null },
  })

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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">ImageField / ImageInput</h1>
          <p className="mb-8 text-gray-600">
            이미지 업로드/미리보기/빈상태 공통 컴포넌트. 폼은 ImageField(RHF), 제어 상태는
            ImageInput.
          </p>

          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">폼 (ImageField + RHF)</h2>
            <div className="rounded-lg border p-6">
              <Form {...form}>
                <ImageField
                  control={form.control}
                  name="images"
                  label="작업물 이미지"
                  hint="장당 5MB 이하 이미지"
                />
              </Form>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">단일 (single)</h2>
            <div className="rounded-lg border p-6">
              <ImageInput value={single} onChange={setSingle} />
            </div>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">다중 (multiple)</h2>
            <div className="rounded-lg border p-6">
              <ImageInput value={multi} onChange={setMulti} multiple maxFiles={5} />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Usage</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              {`import { ImageField, ImageInput } from '@bconnect/ui'

// 폼 (react-hook-form)
<ImageField control={form.control} name="images" />
<ImageField control={form.control} name="images" multiple maxFiles={5} />

// 제어 상태 (필터 등 폼 밖)
<ImageInput value={value} onChange={setValue} />`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
