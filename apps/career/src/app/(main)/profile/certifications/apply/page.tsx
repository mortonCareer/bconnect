/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1240-8132
 * @figma-state 경력증명서 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1240-8451
 * @figma-state 기능등급증명서 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-8927
 * @figma-state 기타증명서 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-9148
 * @figma-state 국가기술자격증 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-9351
 * @figma-state 숙련기술인 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-9424
 * @figma-state 기타자격증 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-9568
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGetMyCredentials, useCreateCredential, useDeleteCredential } from '@bconnect/api-client'
import type { CredentialType, CreateCredentialRequest } from '@bconnect/api-client'
import { ConfirmDialog, Tab, TopBar, toast } from '@bconnect/ui'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { OneClickTab } from './_components/OneClickTab'
import { CertificateTab } from './_components/CertificateTab'
import { QualificationTab } from './_components/QualificationTab'
import { APPLY_TAB_KEYS } from '../_lib/applyTabs'

const TAB_ITEMS = [
  { key: 'one-click', label: '원클릭 조회' },
  { key: 'certificate', label: '증명서' },
  { key: 'qualification', label: '자격증' },
]

export default function CertificationApplyPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringLiteral(APPLY_TAB_KEYS).withDefault('one-click').withOptions({ history: 'push' })
  )
  const [, setSubTab] = useQueryState('sub', { history: 'push' })
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const handleTabChange = (key: string) => {
    setActiveTab(key as (typeof APPLY_TAB_KEYS)[number])
    setSubTab(null)
  }

  // 내 자격증은 useGetMyCredentials(무인자) — profileId 로 조회하던 useGetCredentials 대체.
  const {
    data: credentials,
    isLoading: isCredentialsLoading,
    isError: isCredentialsError,
    refetch: refetchCredentials,
  } = useGetMyCredentials()

  // create/deleteCredential→getMyCredentials 무효화는 config(mutationInvalidates)가 자동 처리 (ADR-0025).
  const { mutate: createCredential, mutateAsync: createCredentialAsync } = useCreateCredential()

  const handleOneClickApply = async (requests: CreateCredentialRequest[]) => {
    await Promise.all(requests.map((data) => createCredentialAsync({ data })))
  }

  const { mutate: deleteCredential } = useDeleteCredential()

  // 하단 인증 목록 상태 — 각 탭에 주입.
  const listIsLoading = isCredentialsLoading
  const listIsError = isCredentialsError
  const handleRetry = () => {
    refetchCredentials()
  }

  // 파일/메모 제출 — presign(#340) 전까지 실제 업로드(payload)는 보류하고 타입만 생성한다.
  const handleSubmit = (type: CredentialType) => {
    const isOther = type === 'OTHER_CERTIFICATE' || type === 'OTHER_QUALIFICATION'
    createCredential(
      { data: { type } },
      {
        onSuccess: () =>
          toast({
            description: isOther ? '제출했어요. 검토 후 반영돼요' : '인증 정보가 갱신되었어요',
            variant: 'success',
          }),
      }
    )
  }

  const credentialsList = credentials ?? []

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="인증 신청" showAction={false} onBack={() => router.back()} />

      <Tab items={TAB_ITEMS} activeKey={activeTab} onChange={handleTabChange} />

      {activeTab === 'one-click' && (
        <OneClickTab
          credentials={credentialsList}
          onApply={handleOneClickApply}
          onRequestDelete={setPendingDeleteId}
          isLoading={listIsLoading}
          isError={listIsError}
          onRetry={handleRetry}
        />
      )}

      {activeTab === 'certificate' && (
        <CertificateTab
          credentials={credentialsList}
          onRequestDelete={setPendingDeleteId}
          onSubmit={handleSubmit}
          isLoading={listIsLoading}
          isError={listIsError}
          onRetry={handleRetry}
        />
      )}

      {activeTab === 'qualification' && (
        <QualificationTab
          credentials={credentialsList}
          onRequestDelete={setPendingDeleteId}
          onSubmit={handleSubmit}
          isLoading={listIsLoading}
          isError={listIsError}
          onRetry={handleRetry}
        />
      )}

      <ConfirmDialog
        open={pendingDeleteId != null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
        title="인증을 삭제할까요?"
        description="삭제한 인증은 복구할 수 없어요."
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          if (pendingDeleteId == null) return
          deleteCredential({ id: pendingDeleteId })
        }}
      />
    </div>
  )
}
