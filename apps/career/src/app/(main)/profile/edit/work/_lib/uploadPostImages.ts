import {
  AttachmentContext,
  AttachmentType,
  createAttachmentConfirm,
  createAttachmentPresign,
} from '@bconnect/api-client'

/**
 * 작업물 이미지 업로드 — presign → S3 직접 PUT → confirm 3단계를 묶어 attachmentIds 를 돌려준다.
 *
 * - context: POST / type: IMAGE
 * - contextId 는 로그인한 memberId. BE `PostAttachmentValidator` 가 memberId === contextId 만 검사하므로
 *   post 가 아직 없어도(등록 시점) memberId 로 presign 가능하다 (닭-달걀 회피).
 * - S3 업로드는 presigned URL 로의 plain PUT — customFetch(인증/envelope)를 태우지 않는다.
 */
export async function uploadPostImages(files: File[], memberId: number): Promise<number[]> {
  if (files.length === 0) return []

  const presigned = await createAttachmentPresign({
    context: AttachmentContext.POST,
    type: AttachmentType.IMAGE,
    contextId: memberId,
    files: files.map((file) => ({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    })),
  })

  await Promise.all(
    presigned.map((slot, i) => {
      const file = files[i]
      if (!slot.uploadUrl || !file) {
        throw new Error('presign 응답이 파일과 일치하지 않습니다.')
      }
      return fetch(slot.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      }).then((res) => {
        if (!res.ok) throw new Error(`이미지 업로드에 실패했습니다. (${res.status})`)
      })
    })
  )

  const attachmentIds = presigned.map((slot) => slot.id).filter((id): id is number => id != null)
  await createAttachmentConfirm({ attachmentIds })

  return attachmentIds
}
