'use client'

import { useState } from 'react'
import {
  createAttachmentPresign,
  createAttachmentConfirm,
  useUpdateMyMemberPicture,
  useQueryClient,
  getGetMyProfileQueryKey,
  AttachmentContext,
  AttachmentType,
} from '@bconnect/api-client'
import { toast, isApiErrorShape } from '@bconnect/ui'

// presign → S3 PUT → confirm 2-phase 업로드 (#340 계약). MEMBER 컨텍스트의 contextId는 본인 memberId.
async function uploadProfileImage(file: File, memberId: number): Promise<number> {
  const [presigned] = await createAttachmentPresign({
    context: AttachmentContext.MEMBER,
    type: AttachmentType.IMAGE,
    contextId: memberId,
    files: [{ filename: file.name, contentType: file.type, size: file.size }],
  })
  if (presigned?.id == null || !presigned.uploadUrl) throw new Error('업로드 URL 누락')
  const res = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!res.ok) throw new Error(`이미지 업로드 실패 (${res.status})`)
  await createAttachmentConfirm({ attachmentIds: [presigned.id] })
  return presigned.id
}

/**
 * 프로필 이미지 수정 (#966) — OS 파일 picker로 단일 이미지 선택 후 즉시 업로드·반영.
 * updateMyMemberPicture 뒤 getMyProfile 을 수동 무효화 (picture 표시원이 /profiles/me 라
 * orval 자동 무효화 범위(/members/me) 밖).
 */
export function useProfileImageUpload(memberId: number) {
  const queryClient = useQueryClient()
  const [isUploading, setIsUploading] = useState(false)
  const updatePicture = useUpdateMyMemberPicture()

  const pickAndUpload = () => {
    if (memberId <= 0 || isUploading) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setIsUploading(true)
      try {
        const pictureId = await uploadProfileImage(file, memberId)
        await updatePicture.mutateAsync({ data: { pictureId } })
        await queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() })
        toast({ description: '프로필 이미지를 변경했어요', variant: 'success' })
      } catch (error) {
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '이미지 변경에 실패했어요. 다시 시도해주세요',
          variant: 'error',
        })
      } finally {
        setIsUploading(false)
      }
    }
    input.click()
  }

  return { pickAndUpload, isUploading }
}
