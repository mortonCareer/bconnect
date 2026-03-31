'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useQueryClient,
  useGetMyProfile,
  useGetCredentials,
  useCreateCredential,
  useDeleteCredential,
  getGetCredentialsQueryKey,
} from '@morton/api-client'
import { Tab, TopBar } from '@morton/ui'
import { MOCK_CREDENTIALS } from '../constants'
import { OneClickTab } from './_components/OneClickTab'
import { CertificateTab } from './_components/CertificateTab'
import { QualificationTab } from './_components/QualificationTab'

const TAB_ITEMS = [
  { key: 'one-click', label: '원클릭 조회' },
  { key: 'certificate', label: '증명서' },
  { key: 'qualification', label: '자격증' },
]

export default function CertificationApplyPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('one-click')

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useGetMyProfile({ query: { retry: false } })
  const profileId = profile?.id

  const { data: credentials, isLoading: isCredentialsLoading } = useGetCredentials(
    { profileId: profileId! },
    { query: { enabled: !!profileId } }
  )

  // API 에러 시 mock 데이터 폴백
  const useMock = isProfileError || (!isProfileLoading && !profileId)

  const invalidateCredentials = () => {
    if (profileId) {
      queryClient.invalidateQueries({
        queryKey: getGetCredentialsQueryKey({ profileId }),
      })
    }
  }

  const { mutate: createCredential } = useCreateCredential({
    mutation: { onSuccess: invalidateCredentials },
  })

  const { mutate: deleteCredential, isPending: isDeleting } = useDeleteCredential({
    mutation: { onSuccess: invalidateCredentials },
  })

  const isLoading = !useMock && (isProfileLoading || isCredentialsLoading)

  const handleDelete = (credentialId: number) => {
    deleteCredential({ credentialId })
  }

  const handleSubmitOther = (_note: string) => {
    // TODO: 기타 증명서/자격증 제출 API 연동 (파일 업로드 포함)
    const type =
      activeTab === 'certificate' ? 'OTHER_CERTIFICATE' : ('OTHER_QUALIFICATION' as const)
    createCredential({ data: { type } })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <TopBar variant="default" title="인증 신청" showAction={false} />
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  const credentialsList = useMock ? MOCK_CREDENTIALS : (credentials ?? [])

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="인증 신청" showAction={false} onBack={() => router.back()} />

      <Tab items={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === 'one-click' && (
        <OneClickTab
          credentials={credentialsList}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      )}

      {activeTab === 'certificate' && (
        <CertificateTab
          credentials={credentialsList}
          onDelete={handleDelete}
          onSubmitOther={handleSubmitOther}
          isDeleting={isDeleting}
        />
      )}

      {activeTab === 'qualification' && (
        <QualificationTab
          credentials={credentialsList}
          onDelete={handleDelete}
          onSubmitOther={handleSubmitOther}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}
