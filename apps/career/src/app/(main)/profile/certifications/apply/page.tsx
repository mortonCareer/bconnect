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

import { useRouter } from 'next/navigation'
import {
  useQueryClient,
  useGetMyProfile,
  useGetCredentials,
  useCreateCredential,
  useDeleteCredential,
  getGetCredentialsQueryKey,
} from '@bconnect/api-client'
import { Tab, TopBar } from '@bconnect/ui'
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
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringLiteral(APPLY_TAB_KEYS).withDefault('one-click').withOptions({ history: 'push' })
  )
  const [, setSubTab] = useQueryState('sub', { history: 'push' })

  const handleTabChange = (key: string) => {
    setActiveTab(key as (typeof APPLY_TAB_KEYS)[number])
    setSubTab(null)
  }

  const { data: profile, isLoading: isProfileLoading } = useGetMyProfile()
  const profileId = profile?.id

  const { data: credentials, isLoading: isCredentialsLoading } = useGetCredentials(
    { profileId: profileId! },
    { query: { enabled: !!profileId } }
  )

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

  const isLoading = isProfileLoading || isCredentialsLoading

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
          <p className="text-m-14 text-gray-500">로딩 중...</p>
        </div>
      </div>
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
