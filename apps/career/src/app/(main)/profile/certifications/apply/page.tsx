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
import {
  useGetMyCredentials,
  useGetMyMember,
  useCreateCredential,
  useDeleteCredential,
  createAttachmentPresign,
  createAttachmentConfirm,
  AttachmentContext,
  AttachmentType,
} from '@bconnect/api-client'
import type { CredentialType, CreateCredentialRequest } from '@bconnect/api-client'
import { ConfirmDialog, Tab, TopBar, toast, type FileValue } from '@bconnect/ui'
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

// presign → S3 PUT → confirm 2-phase 업로드 (#340 계약). CREDENTIAL 컨텍스트의 contextId는 본인 memberId.
async function uploadCredentialFile(file: File, memberId: number): Promise<number> {
  const [presigned] = await createAttachmentPresign({
    context: AttachmentContext.CREDENTIAL,
    type: AttachmentType.FILE,
    contextId: memberId,
    files: [{ filename: file.name, contentType: file.type, size: file.size }],
  })
  if (presigned?.id == null || !presigned.uploadUrl) throw new Error('업로드 URL 누락')
  const res = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!res.ok) throw new Error(`파일 업로드 실패 (${res.status})`)
  await createAttachmentConfirm({ attachmentIds: [presigned.id] })
  return presigned.id
}

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

  // 내 자격 증빙은 useGetMyCredentials(무인자) — profileId 로 조회하던 useGetCredentials 대체.
  const {
    data: credentials,
    isLoading: isCredentialsLoading,
    isError: isCredentialsError,
    refetch: refetchCredentials,
  } = useGetMyCredentials()

  const { data: me } = useGetMyMember()

  // create/deleteCredential→getMyCredentials 무효화는 config(mutationInvalidates)가 자동 처리 (ADR-0025).
  const { mutateAsync: createCredentialAsync } = useCreateCredential()

  const handleOneClickApply = async (requests: CreateCredentialRequest[]) => {
    await Promise.all(requests.map((data) => createCredentialAsync({ data })))
  }

  const { mutate: deleteCredential } = useDeleteCredential()

  // 하단 자격 증빙 목록 상태 — 각 탭에 주입.
  const listIsLoading = isCredentialsLoading
  const listIsError = isCredentialsError
  const handleRetry = () => {
    refetchCredentials()
  }

  // 파일 제출 — presign 업로드 후 attachmentId로 credential 생성. 성공 여부를 돌려줘 탭이 폼 리셋을 결정.
  // note는 CreateCredentialRequest에 자리 없어 미전송 (#609 BE 갭).
  const handleSubmit = async (
    type: CredentialType,
    payload: { file: FileValue | null; note?: string }
  ): Promise<boolean> => {
    const isOther = type === 'OTHER_CERTIFICATE' || type === 'OTHER_QUALIFICATION'
    try {
      let attachmentId: number | undefined
      if (payload.file instanceof File) {
        if (me?.id == null) throw new Error('회원 정보 로드 전')
        attachmentId = await uploadCredentialFile(payload.file, me.id)
      }
      await createCredentialAsync({ data: { type, attachmentId } })
      toast({
        description: isOther ? '제출했어요. 검토 후 반영돼요' : '자격 증빙이 갱신되었어요',
        variant: 'success',
      })
      return true
    } catch {
      toast({ description: '제출에 실패했어요. 다시 시도해주세요', variant: 'error' })
      return false
    }
  }

  const credentialsList = credentials ?? []

  return (
    <div className="flex flex-col">
      <TopBar
        variant="default"
        title="자격 증빙 신청"
        showAction={false}
        onBack={() => router.back()}
      />

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
        title="자격 증빙을 삭제할까요?"
        description="삭제한 자격 증빙은 복구할 수 없어요."
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
