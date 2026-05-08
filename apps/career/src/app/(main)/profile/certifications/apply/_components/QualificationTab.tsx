'use client'

import { useState } from 'react'
import type { Credential, CredentialType } from '@bconnect/api-client'
import { Button, Tag } from '@bconnect/ui'
import { getCredentialLabel, formatDate } from '../../constants'

interface QualificationTabProps {
  credentials: Credential[]
  onDelete: (id: number) => void
  onSubmitOther: (note: string) => void
  isDeleting: boolean
}

const SUB_TABS = [
  { key: 'national', label: '국가기술자격증' },
  { key: 'skilled', label: '숙련기술인' },
  { key: 'other', label: '그 외' },
]

const SUB_TAB_TYPE_MAP: Record<string, CredentialType> = {
  national: 'NATIONAL_TECHNICAL_QUALIFICATION',
  skilled: 'SKILLED_TECHNICIAN',
  other: 'OTHER_QUALIFICATION',
}

const SUB_TAB_INFO: Record<string, { title: string; description: string }> = {
  national: {
    title: '국가기술자격증',
    description: '한국산업인력공단이 평가·운영하는 국가자격이에요.',
  },
  skilled: {
    title: '숙련기술인',
    description: '한국산업인력공단이 인정한 숙련기술 보유자에요.',
  },
  other: {
    title: '기타 자격증',
    description: '다른 항목에 해당하지 않는 자격증이에요. 검토 후 승인된 경우에 프로필에 반영돼요.',
  },
}

export function QualificationTab({
  credentials,
  onDelete,
  onSubmitOther,
  isDeleting,
}: QualificationTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('national')
  const [otherNote, setOtherNote] = useState('')

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
        <h3 className="text-sb-16 text-bconnect-gray-900">{info.title}</h3>
        <p className="text-r-12 text-bconnect-gray-700">
          {info.description} <span className="text-bconnect-primary underline">자세히보기</span>
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
          <p className="text-center text-r-12 text-bconnect-gray-700">2026.02.21 업데이트됨</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Button variant="secondary" size="full" disabled>
            파일 제출
          </Button>
          <textarea
            className="h-24 w-full resize-none rounded-lg border border-bconnect-gray-300 px-3 py-2 text-r-14 text-bconnect-gray-900 placeholder:text-bconnect-gray-500 focus:border-bconnect-primary focus:outline-none focus:ring-1 focus:ring-bconnect-primary"
            placeholder="검토시 참고할 내용을 작성해주세요..."
            value={otherNote}
            onChange={(e) => setOtherNote(e.target.value)}
          />
          <Button
            variant="primary"
            size="full"
            disabled={!otherNote.trim()}
            onClick={() => {
              onSubmitOther(otherNote)
              setOtherNote('')
            }}
          >
            제출하기
          </Button>
        </div>
      )}

      {/* 하단 인증 목록 — 심플 리스트 */}
      {filteredCredentials.length > 0 && (
        <div className="flex flex-col">
          {filteredCredentials.map((credential) => (
            <div
              key={credential.id}
              className="flex items-center justify-between border-b border-bconnect-gray-300 py-3"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-r-14 text-bconnect-gray-900">
                  {credential.type ? getCredentialLabel(credential.type) : '알 수 없음'}
                </span>
                {credential.expiredAt && (
                  <span className="text-r-10 text-bconnect-gray-700">
                    {formatDate(credential.expiredAt)} 만료
                  </span>
                )}
              </div>
              <button
                className="rounded border border-bconnect-gray-500 px-3 py-1 text-r-14 text-bconnect-gray-700"
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
