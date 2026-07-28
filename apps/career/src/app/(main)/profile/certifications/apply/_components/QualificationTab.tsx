'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useForm, useWatch } from 'react-hook-form'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import type { Credential, CredentialType } from '@bconnect/api-client'
import {
  Button,
  FileField,
  Form,
  FormSubmitButton,
  Tag,
  TextareaField,
  type FileValue,
} from '@bconnect/ui'
import {
  QUALIFICATION_SUB_KEYS,
  QUALIFICATION_SUB_TABS,
} from '@/app/(main)/profile/certifications/_lib/applyTabs'
import { CredentialList } from '@/app/(main)/profile/certifications/_components/CredentialList'

interface QualificationTabProps {
  credentials: Credential[]
  onRequestDelete: (id: number) => void
  onSubmit: (
    type: CredentialType,
    payload: { file: FileValue | null; note?: string }
  ) => Promise<boolean>
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

interface FormValues {
  file: FileValue | null
  note: string
}

export function QualificationTab({
  credentials,
  onRequestDelete,
  onSubmit,
  isLoading,
  isError,
  onRetry,
}: QualificationTabProps) {
  const [activeSubTab, setActiveSubTab] = useQueryState(
    'sub',
    parseAsStringLiteral(QUALIFICATION_SUB_KEYS)
      .withDefault('national')
      .withOptions({ history: 'push' })
  )

  const form = useForm<FormValues>({ mode: 'onTouched', defaultValues: { file: null, note: '' } })
  const file = useWatch({ control: form.control, name: 'file' })
  const hasFile = file != null

  const info = QUALIFICATION_SUB_TABS[activeSubTab]
  const isOther = activeSubTab === 'other'
  const filteredCredentials = credentials.filter((c) => c.type === info.type)

  // 서브탭 전환 시 입력값 초기화 — 한 탭에서 고른 파일이 다른 탭으로 새지 않게.
  useEffect(() => {
    form.reset({ file: null, note: '' })
  }, [activeSubTab, form])

  // 실패 시 리셋하지 않아 고른 파일이 유지 — 재시도 가능.
  const submit = form.handleSubmit(async (data) => {
    const ok = await onSubmit(info.type, { file: data.file, note: isOther ? data.note : undefined })
    if (ok) form.reset({ file: null, note: '' })
  })

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 px-4 py-4">
        {/* 서브 탭 */}
        <div className="flex flex-wrap gap-2">
          {QUALIFICATION_SUB_KEYS.map((key) => (
            <Tag
              key={key}
              variant={activeSubTab === key ? 'selected' : 'default'}
              size="sm"
              onClick={() => setActiveSubTab(key)}
            >
              {QUALIFICATION_SUB_TABS[key].label}
            </Tag>
          ))}
        </div>

        {/* 타이틀 + 설명 */}
        <div className="flex flex-col gap-1">
          <h3 className="text-sb-14 text-gray-900">{info.title}</h3>
          <p className="whitespace-pre-line text-r-12 text-gray-500">
            {info.description}
            {!isOther && info.detailHref && (
              <>
                {' '}
                <Link
                  href={info.detailHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-500 underline"
                >
                  자세히보기
                </Link>
              </>
            )}
          </p>
        </div>

        {/* 폼 — 발급받기 / 파일 업로드 / (그 외) 메모 + 제출 */}
        <Form {...form}>
          <form onSubmit={submit} className="flex flex-col gap-3">
            {!isOther && info.issueHref && (
              <Button asChild variant="primary" size="full">
                <a href={info.issueHref} target="_blank" rel="noreferrer">
                  발급받기
                </a>
              </Button>
            )}
            <FileField control={form.control} name="file" />
            {isOther && (
              <TextareaField
                control={form.control}
                name="note"
                rows={4}
                placeholder="검토시 참고할 내용을 작성해주세요..."
              />
            )}
            {(isOther || hasFile) && (
              <FormSubmitButton
                variant="primary"
                size="full"
                requireAllFilled={false}
                disabled={!hasFile}
                isLoading={form.formState.isSubmitting}
              >
                제출하기
              </FormSubmitButton>
            )}
          </form>
        </Form>
      </div>

      {/* 하단 자격 증빙 목록 */}
      <CredentialList
        credentials={filteredCredentials}
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        onRequestDelete={onRequestDelete}
        emptyText="아직 등록된 자격증이 없어요"
      />
    </div>
  )
}
