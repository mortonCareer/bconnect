'use client'

import { useState } from 'react'
import type { Credential, CredentialType } from '@morton/api-client'
import { Button, Tag } from '@morton/ui'
import { CredentialItem } from '../../_components/CredentialItem'
import { formatDate } from '../../constants'

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

const SUB_TAB_DESCRIPTIONS: Record<string, string> = {
  national: '국가기술자격증을 제출해주세요.',
  skilled: '숙련기술인 인증서를 제출해주세요.',
  other: '기타 자격증을 파일로 제출해주세요.',
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

  const lastUpdated =
    filteredCredentials.length > 0
      ? filteredCredentials
          .filter((c) => c.modifiedAt)
          .sort((a, b) => new Date(b.modifiedAt!).getTime() - new Date(a.modifiedAt!).getTime())[0]
          ?.modifiedAt
      : null

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

      {/* 설명 */}
      <p className="text-m-14 text-morton-gray-700">{SUB_TAB_DESCRIPTIONS[activeSubTab]}</p>

      {/* 일반 서브탭 (국가기술자격증, 숙련기술인) */}
      {activeSubTab !== 'other' && (
        <div className="flex flex-col gap-3">
          <Button variant="outline" size="full" disabled>
            발급받기
          </Button>
          <Button variant="secondary" size="full" disabled>
            파일 업로드
          </Button>
        </div>
      )}

      {/* 그 외 서브탭 */}
      {activeSubTab === 'other' && (
        <div className="flex flex-col gap-3">
          <Button variant="secondary" size="full" disabled>
            파일 제출
          </Button>
          <textarea
            className="h-24 w-full resize-none rounded-lg border border-morton-gray-300 px-3 py-2 text-sm text-morton-gray-900 placeholder:text-morton-gray-500 focus:border-morton-primary focus:outline-none focus:ring-1 focus:ring-morton-primary"
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

      {/* 기존 인증 목록 */}
      {filteredCredentials.length > 0 && (
        <div className="flex flex-col">
          {lastUpdated && (
            <p className="pb-2 text-r-12 text-morton-gray-500">
              {formatDate(lastUpdated)} 업데이트됨
            </p>
          )}
          <div className="flex flex-col divide-y divide-morton-gray-200 rounded-lg border border-morton-gray-200">
            {filteredCredentials.map((credential) => (
              <CredentialItem
                key={credential.id}
                credential={credential}
                onDelete={onDelete}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
