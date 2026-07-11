'use client'

import {
  AttachmentContext,
  AttachmentType,
  BoardType,
  DriveType,
  createAttachmentConfirm,
  createAttachmentPresign,
  createDriveAttachments,
  getGetDriveImagesQueryKey,
  getGetDriveNotesQueryKey,
  getGetMyDriveQueryKey,
  useCreateDrive,
  useCreateNote,
  useDeleteDrive,
  useDeleteNote,
  useGetDriveImages,
  useGetDriveNotes,
  useGetMyDrive,
  useMutation,
  useQueryClient,
  useUpdateDriveName,
  useUpdateNote,
} from '@bconnect/api-client'
import type { Attachment, Drive, Note } from '@bconnect/api-client'
import type { BoardImage, Folder, Memo, QueryResult } from '@bconnect/features'

// Drive/Attachment/Note → features 표현 타입. 동산보드 메타(행표·위치·설명)와 폴더
// 썸네일/개수는 BE 저장 자리가 없어 빈 값 고정 — 후속 BE 이슈로 추적.
const toFolder = (d: Drive): Folder => ({
  id: String(d.id),
  projectId: d.projectId != null ? String(d.projectId) : '',
  title: d.title ?? '',
  createdAt: d.createdAt ?? '',
  fileCount: 0,
})

const toBoardImage =
  (folderId: string) =>
  (a: Attachment): BoardImage => ({
    id: String(a.id),
    folderId,
    imageUrl: a.url ?? '',
    filename: a.filename,
    boardRows: [],
    boardPosition: 'tl',
    description: '',
    createdAt: a.createdAt ?? '',
  })

const toMemo =
  (folderId: string) =>
  (n: Note): Memo => ({
    id: String(n.id),
    folderId,
    content: n.content ?? '',
    createdAt: n.createdAt ?? '',
  })

/** career: 배정 프로젝트 전체의 폴더 평면 목록 (사이드바 프로젝트 스코프 없음). */
export function useAllFolders(): QueryResult<Folder[]> {
  return useGetMyDrive({ query: { select: (drives) => drives.map(toFolder) } })
}

export function useFolder(folderId: string): QueryResult<Folder> {
  return useGetMyDrive({
    query: {
      select: (drives) => {
        const drive = drives.find((d) => String(d.id) === folderId)
        return drive ? toFolder(drive) : undefined
      },
    },
  })
}

export function useFolderImages(folderId: string): QueryResult<BoardImage[]> {
  return useGetDriveImages(Number(folderId), {
    query: { select: (images) => images.map(toBoardImage(folderId)) },
  })
}

export function useFolderMemos(folderId: string): QueryResult<Memo[]> {
  return useGetDriveNotes(Number(folderId), {
    query: { select: (notes) => notes.map(toMemo(folderId)) },
  })
}

export function useFolderMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetMyDriveQueryKey() })

  const { mutate: mutateCreate } = useCreateDrive({ mutation: { onSuccess: invalidate } })
  const { mutate: mutateRename } = useUpdateDriveName({ mutation: { onSuccess: invalidate } })
  const { mutate: mutateDelete } = useDeleteDrive({ mutation: { onSuccess: invalidate } })

  return {
    createFolder: (title: string) => mutateCreate({ data: { type: DriveType.MEMBER, title } }),
    updateFolder: (id: string, title: string) => mutateRename({ id: Number(id), data: { title } }),
    deleteFolder: (id: string) => mutateDelete({ id: Number(id) }),
  }
}

export function useMemoMutations(folderId: string) {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetDriveNotesQueryKey(Number(folderId)) })

  const { mutate: mutateCreate } = useCreateNote({ mutation: { onSuccess: invalidate } })
  const { mutate: mutateUpdate } = useUpdateNote({ mutation: { onSuccess: invalidate } })
  const { mutate: mutateDelete } = useDeleteNote({ mutation: { onSuccess: invalidate } })

  return {
    createMemo: (content: string) =>
      mutateCreate({ data: { type: BoardType.DRIVE, driveId: Number(folderId), content } }),
    updateMemo: (id: string, content: string) =>
      mutateUpdate({ id: Number(id), data: { content } }),
    deleteMemo: (id: string) => mutateDelete({ id: Number(id) }),
  }
}

/** presign → S3 PUT → confirm → 드라이브 바인딩 순서의 2-phase 업로드 (#340 계약). */
export function useUploadImages(folderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (files: File[]) => {
      const driveId = Number(folderId)
      const presigned = await createAttachmentPresign({
        context: AttachmentContext.DRIVE,
        type: AttachmentType.IMAGE,
        contextId: driveId,
        files: files.map((f) => ({ filename: f.name, contentType: f.type, size: f.size })),
      })
      // presign 응답 순서 = 요청 files 순서 — 파일↔URL 상관관계는 이 순서뿐
      await Promise.all(
        presigned.map(async (p, i) => {
          if (!p.uploadUrl) throw new Error('업로드 URL 누락')
          const res = await fetch(p.uploadUrl, {
            method: 'PUT',
            body: files[i],
            headers: { 'Content-Type': files[i].type },
          })
          if (!res.ok) throw new Error(`이미지 업로드 실패 (${res.status})`)
        })
      )
      const attachmentIds = presigned.map((p) => p.id).filter((id): id is number => id != null)
      await createAttachmentConfirm({ attachmentIds })
      await createDriveAttachments(driveId, { attachmentIds })
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: getGetDriveImagesQueryKey(Number(folderId)) }),
  })
}
