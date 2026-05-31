'use client'

import type { Credential, CredentialType } from '@bconnect/api-client'
import { Button, Form, Tag, TextareaField } from '@bconnect/ui'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { formatDate, getCredentialLabel } from '../../constants'

interface CertificateTabProps {
  credentials: Credential[]
  onDelete: (id: number) => void
  onSubmitOther: (note: string) => void
  isDeleting: boolean
}

const SUB_TABS = [
  { key: 'career', label: '경력증명서' },
  { key: 'skill-grade', label: '기능등급증명서' },
  { key: 'other', label: '그 외' },
]

const SUB_TAB_TYPE_MAP: Record<string, CredentialType> = {
  career: 'CAREER_CERTIFICATE',
  'skill-grade': 'SKILL_GRADE_CERTIFICATE',
  other: 'OTHER_CERTIFICATE',
}

const SUB_TAB_INFO: Record<string, { title: string; description: string }> = {
  career: {
    title: '경력증명서',
    description: '건설근로자공제회에 등록된 건설업 경력 현황이에요.',
  },
  'skill-grade': {
    title: '기능등급증명서',
    description: '건설근로자공제회 기준 기능등급 현황이에요.',
  },
  other: {
    title: '기타 증명서',
    description: '다른 항목에 해당하지 않는 증명서에요. 검토 후 승인된 경우에 프로필에 반영돼요.',
  },
}

export function CertificateTab({
  credentials,
  onDelete,
  onSubmitOther,
  isDeleting,
}: CertificateTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('career')

  // "그 외" 서브탭의 검토 참고 note — 단일 필드 폼 (검증 메시지 없음, 입력 시에만 제출 활성)
  const form = useForm<{ note: string }>({ mode: 'onTouched', defaultValues: { note: '' } })
  const note = useWatch({ control: form.control, name: 'note' })
  const submitOther = form.handleSubmit((data) => {
    onSubmitOther(data.note)
    form.reset({ note: '' })
  })

  const currentType = SUB_TAB_TYPE_MAP[activeSubTab]
  const filteredCredentials = credentials.filter((c) => c.type === currentType)
  const info = SUB_TAB_INFO[activeSubTab]

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* 서브 탭 */}
      <div className="flex flex-wrap gap-2">
        {SUB_TABS.map((tab) => (
          <Tag
            key={tab.key}
            variant={activeSubTab === tab.key ? 'selected' : 'default'}
            size="sm"
            onClick={() => setActiveSubTab(tab.key)}
          >
            {tab.label}
          </Tag>
        ))}
      </div>

      {/* 타이틀 + 설명 */}
      <div className="flex flex-col gap-1">
        <h3 className="text-sb-16 text-gray-900">{info.title}</h3>
        <p className="text-r-12 text-gray-700">
          {info.description} <span className="text-primary underline">자세히보기</span>
        </p>
      </div>

      {/* 버튼 영역 */}
      {activeSubTab !== 'other' ? (
        <div className="flex flex-col gap-3">
          <Button variant="outline" size="full">
            발급받기
          </Button>
          <Button variant="secondary" size="full" disabled>
            파일 업로드
          </Button>
          <p className="text-center text-r-12 text-gray-700">2026.02.21 업데이트됨</p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={submitOther} className="flex flex-col gap-3">
            <Button type="button" variant="secondary" size="full" disabled>
              파일 업로드
            </Button>
            <TextareaField
              control={form.control}
              name="note"
              rows={4}
              placeholder="검토시 참고할 내용을 작성해주세요..."
            />
            <Button type="submit" variant="primary" size="full" disabled={!note?.trim()}>
              제출하기
            </Button>
          </form>
        </Form>
      )}

      {/* 하단 인증 목록 — 심플 리스트 */}
      {filteredCredentials.length > 0 && (
        <div className="flex flex-col">
          {filteredCredentials.map((credential) => (
            <div
              key={credential.id}
              className="flex items-center justify-between border-b border-gray-300 py-3"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-r-14 text-gray-900">
                  {credential.type ? getCredentialLabel(credential.type) : '알 수 없음'}
                </span>
                {credential.expiredAt && (
                  <span className="text-r-10 text-gray-700">
                    {formatDate(credential.expiredAt)} 만료
                  </span>
                )}
              </div>
              <button
                className="rounded border border-gray-500 px-3 py-1 text-r-14 text-gray-700"
                onClick={() => onDelete(credential.id!)}
                disabled={isDeleting}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
