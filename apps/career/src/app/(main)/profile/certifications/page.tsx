/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1239-7678
 */
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useQueryClient,
  useGetMyProfile,
  useGetCredentials,
  useDeleteCredential,
  getGetCredentialsQueryKey,
} from '@bconnect/api-client'
import { Button, ConfirmDialog, TopBar } from '@bconnect/ui'
import { CredentialItem } from './_components/CredentialItem'

export default function CertificationsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: profile, isLoading: isProfileLoading } = useGetMyProfile()
  const profileId = profile?.id

  const { data: credentials, isLoading: isCredentialsLoading } = useGetCredentials(
    { profileId: profileId! },
    { query: { enabled: !!profileId } }
  )

  const { mutate: deleteCredential } = useDeleteCredential({
    mutation: {
      onSuccess: () => {
        if (profileId) {
          queryClient.invalidateQueries({
            queryKey: getGetCredentialsQueryKey({ profileId }),
          })
        }
      },
    },
  })

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const credentialsList = credentials ?? []
  const isLoading = isProfileLoading || isCredentialsLoading

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <TopBar variant="default" title="인증" showAction={false} />
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="인증" showAction={false} onBack={() => router.back()} />

      {/* 설명 문구 */}
      <p className="px-4 py-3 text-r-12 text-gray-500">
        인증 정보를 프로필에 표시하고 신뢰도를 높여보세요
      </p>

      {/* 인증 목록 */}
      {credentialsList.length > 0 ? (
        <div className="flex flex-col divide-y divide-gray-300">
          {credentialsList.map((credential) => (
            <CredentialItem
              key={credential.id}
              credential={credential}
              onRequestDelete={setPendingDeleteId}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-20">
          <p className="text-m-14 text-gray-500">등록된 인증이 없습니다</p>
        </div>
      )}

      {/* 인증 추가하기 버튼 */}
      <div className="px-4 py-3">
        <Button asChild variant="primary" size="full">
          <Link href="/profile/certifications/apply">인증 추가하기</Link>
        </Button>
      </div>

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
          deleteCredential({ credentialId: pendingDeleteId })
        }}
      />
    </div>
  )
}
