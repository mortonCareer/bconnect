/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1239-7678
 */
'use client'

import { useRouter } from 'next/navigation'
import {
  useQueryClient,
  useGetMyProfile,
  useGetCredentials,
  useDeleteCredential,
  getGetCredentialsQueryKey,
} from '@bconnect/api-client'
import { Button, Tag, TopBar } from '@bconnect/ui'
import { CredentialItem } from './_components/CredentialItem'
import { getCredentialLabel, MOCK_CREDENTIALS } from './constants'

export default function CertificationsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

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

  const { mutate: deleteCredential, isPending: isDeleting } = useDeleteCredential({
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

  // API 에러 시 mock 데이터 폴백
  const useMock = isProfileError || (!isProfileLoading && !profileId)
  const credentialsList = useMock ? MOCK_CREDENTIALS : (credentials ?? [])
  const isLoading = !useMock && (isProfileLoading || isCredentialsLoading)

  const handleDelete = (credentialId: number) => {
    deleteCredential({ credentialId })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <TopBar variant="default" title="인증" showAction={false} />
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  const acceptedCredentials = credentialsList.filter((c) => c.status === 'ACCEPTED')

  return (
    <div className="flex flex-col">
      <TopBar variant="default" title="인증" showAction={false} onBack={() => router.back()} />

      {/* 인증 태그 배지 */}
      {acceptedCredentials.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {acceptedCredentials.map((credential) => (
            <Tag key={credential.id} variant="default" size="sm">
              {credential.type ? getCredentialLabel(credential.type) : '알 수 없음'}
            </Tag>
          ))}
        </div>
      )}

      {/* 인증 추가하기 버튼 */}
      <div className="px-4 py-3">
        <Button
          variant="outline"
          size="full"
          onClick={() => router.push('/profile/certifications/apply')}
        >
          인증 추가하기
        </Button>
        <p className="mt-2 text-center text-r-12 text-morton-gray-500">
          인증 정보를 프로필에 표시하고 신뢰도를 높여보세요
        </p>
      </div>

      {/* 인증 목록 */}
      {credentialsList.length > 0 ? (
        <div className="flex flex-col divide-y divide-morton-gray-300">
          {credentialsList.map((credential) => (
            <CredentialItem
              key={credential.id}
              credential={credential}
              onDelete={handleDelete}
              onRenew={credential.status === 'ACCEPTED' ? handleDelete : undefined}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-20">
          <p className="text-m-14 text-morton-gray-500">등록된 인증이 없습니다</p>
        </div>
      )}
    </div>
  )
}
