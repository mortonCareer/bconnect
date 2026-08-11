'use client'

import { useCallback, useState } from 'react'
import {
  createAttachmentPresign,
  createAttachmentConfirm,
  AttachmentContext,
  AttachmentType,
} from '@bconnect/api-client'
import { toast, isApiErrorShape } from '@bconnect/ui'

// BE app.attachment 설정의 복제본 — 계약으로 노출되지 않아 프런트가 값을 들고 있을 수밖에 없다.
// BE 쪽 값이 바뀌면 여기도 같이 바꿔야 한다 (application.yaml 의 max-batch-size · max-file-size).
export const CHAT_IMAGE_MAX_FILES = 50
export const CHAT_IMAGE_MAX_SIZE_MB = 20

const MAX_BYTES = CHAT_IMAGE_MAX_SIZE_MB * 1024 * 1024

/** 업로드 끝난 장수 / 전체 장수 — 입력창이 "3/5" 로 노출한다 */
export interface ChatImageUploadProgress {
  done: number
  total: number
}

// presign → S3 PUT → confirm 2-phase 업로드 (#340 계약). CHAT 컨텍스트의 contextId 는 chatId.
async function uploadChatImages(
  files: File[],
  chatId: number,
  onUploaded: () => void
): Promise<number[]> {
  const presigned = await createAttachmentPresign({
    context: AttachmentContext.CHAT,
    type: AttachmentType.IMAGE,
    contextId: chatId,
    files: files.map((f) => ({ filename: f.name, contentType: f.type, size: f.size })),
  })
  // presign 응답 순서 = 요청 files 순서 — 파일↔URL 상관관계는 이 순서뿐
  await Promise.all(
    presigned.map(async (p, i) => {
      const file = files[i]
      if (!file || !p.uploadUrl) throw new Error('업로드 URL 누락')
      const res = await fetch(p.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!res.ok) throw new Error(`이미지 업로드 실패 (${res.status})`)
      onUploaded()
    })
  )
  const attachmentIds = presigned.map((p) => p.id).filter((id): id is number => id != null)
  await createAttachmentConfirm({ attachmentIds })
  return attachmentIds
}

/**
 * 채팅 사진 첨부 업로드 (#1150). 앱 어댑터가 호출해 ChatView 의 imageActions 로 주입한다
 * (ADR-0020: features 의 View 는 mutation 을 갖지 않는다).
 *
 * 선택 즉시 업로드하고 첨부 id 만 돌려준다 — 실제 메시지 전송(STOMP publish)은 ChatView 담당.
 * 실패는 여기서 toast 로 알리고 빈 배열을 돌려줘 전송 단계로 넘어가지 않게 한다.
 */
export function useChatImageUpload(chatId: number) {
  const [progress, setProgress] = useState<ChatImageUploadProgress | null>(null)
  const isUploading = progress != null

  const upload = useCallback(
    async (files: File[]): Promise<number[]> => {
      if (isUploading) return []

      const images = files.filter((f) => f.type.startsWith('image/') && f.size <= MAX_BYTES)
      if (images.length < files.length) {
        toast({
          description: `이미지 파일만, 장당 ${CHAT_IMAGE_MAX_SIZE_MB}MB 이하만 보낼 수 있어요`,
          variant: 'error',
        })
      }
      if (images.length === 0) return []

      const targets = images.slice(0, CHAT_IMAGE_MAX_FILES)
      if (images.length > CHAT_IMAGE_MAX_FILES) {
        toast({
          description: `한 번에 ${CHAT_IMAGE_MAX_FILES}장까지 보낼 수 있어요`,
          variant: 'error',
        })
      }

      setProgress({ done: 0, total: targets.length })
      try {
        return await uploadChatImages(targets, chatId, () =>
          setProgress((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev))
        )
      } catch (error) {
        toast({
          description: isApiErrorShape(error)
            ? error.message
            : '사진을 보내지 못했어요. 다시 시도해주세요',
          variant: 'error',
        })
        return []
      } finally {
        setProgress(null)
      }
    },
    [chatId, isUploading]
  )

  const notifySendError = useCallback(() => {
    toast({ description: '사진을 보내지 못했어요. 다시 시도해주세요', variant: 'error' })
  }, [])

  return { upload, isUploading, progress, notifySendError }
}
