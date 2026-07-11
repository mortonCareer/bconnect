'use client'

import {
  BoardType,
  DriveType,
  getGetDriveNotesQueryKey,
  getGetDrivesQueryKey,
  useCreateDrive,
  useCreateNote,
  useDeleteDrive,
  useDeleteNote,
  useGetDriveImages,
  useGetDriveNotes,
  useGetDrives,
  useQueryClient,
  useUpdateDriveName,
  useUpdateNote,
} from '@bconnect/api-client'
import type { Attachment, Drive, Note } from '@bconnect/api-client'
import type { BoardImage, Folder, Memo, QueryResult, StorageUsage } from '@bconnect/features'

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

export function useFolders(projectId: string): QueryResult<Folder[]> {
  return useGetDrives(
    { projectId: Number(projectId) },
    { query: { select: (drives) => drives.map(toFolder) } }
  )
}

export function useFolder(projectId: string, folderId?: string): QueryResult<Folder> {
  return useGetDrives(
    { projectId: Number(projectId) },
    {
      query: {
        select: (drives) => {
          const drive = drives.find((d) => String(d.id) === folderId)
          return drive ? toFolder(drive) : undefined
        },
      },
    }
  )
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

// 용량바 — BE 엔드포인트 없음(#752 용량 제한 미구현), 시안 유지용 고정 mock.
const MOCK_USAGE: StorageUsage = { usedBytes: 104_000_000, totalBytes: 1_073_741_824 }

export function useStorageUsage(_projectId: string): QueryResult<StorageUsage> {
  return { data: MOCK_USAGE, isLoading: false, isError: false }
}

export function useFolderMutations(projectId: string) {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: getGetDrivesQueryKey({ projectId: Number(projectId) }),
    })

  const { mutate: mutateCreate } = useCreateDrive({ mutation: { onSuccess: invalidate } })
  const { mutate: mutateRename } = useUpdateDriveName({ mutation: { onSuccess: invalidate } })
  const { mutate: mutateDelete } = useDeleteDrive({ mutation: { onSuccess: invalidate } })

  return {
    createFolder: (title: string) =>
      mutateCreate({ data: { type: DriveType.PROJECT, projectId: Number(projectId), title } }),
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
