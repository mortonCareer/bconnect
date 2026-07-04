import type {
  BoardImage,
  Folder,
  Memo,
  MetaTemplate,
  QueryResult,
  StorageUsage,
} from '@bconnect/features'
import { useStorageStore } from './store'

const MOCK_TOTAL_BYTES = 1_073_741_824 // 1GB
const MOCK_BYTES_PER_IMAGE = 17_300_000 // ~17MB (6장 ≈ 104MB, 시안 수치 근사)

/** 동기 인메모리이므로 isLoading 은 항상 false — orval swap 시 실제 로딩으로 플립. */
const ready = <T>(data: T): QueryResult<T> => ({ data, isLoading: false, isError: false })

export function useFolders(projectId: string): QueryResult<Folder[]> {
  const folders = useStorageStore((s) => s.folders)
  return ready(folders.filter((f) => f.projectId === projectId))
}

export function useFolder(folderId: string): QueryResult<Folder> {
  const data = useStorageStore((s) => s.folders.find((f) => f.id === folderId))
  return { data, isLoading: false, isError: false }
}

/** career: 배정 프로젝트 전체의 폴더 평면 목록 (사이드바 프로젝트 스코프 없음). */
export function useAllFolders(): QueryResult<Folder[]> {
  const folders = useStorageStore((s) => s.folders)
  return ready(folders)
}

export function useFolderImages(folderId: string): QueryResult<BoardImage[]> {
  const images = useStorageStore((s) => s.images)
  return ready(images.filter((i) => i.folderId === folderId))
}

export function useFolderMemos(folderId: string): QueryResult<Memo[]> {
  const memos = useStorageStore((s) => s.memos)
  return ready(memos.filter((m) => m.folderId === folderId))
}

export function useStorageUsage(projectId: string): QueryResult<StorageUsage> {
  const folders = useStorageStore((s) => s.folders)
  const images = useStorageStore((s) => s.images)
  const folderIds = new Set(folders.filter((f) => f.projectId === projectId).map((f) => f.id))
  const count = images.filter((i) => folderIds.has(i.folderId)).length
  return ready({ usedBytes: count * MOCK_BYTES_PER_IMAGE, totalBytes: MOCK_TOTAL_BYTES })
}

export function useMetaTemplate(): QueryResult<MetaTemplate> {
  const template = useStorageStore((s) => s.template)
  return ready(template)
}

/** action 들은 store 에서 stable ref — 개별 선택으로 리렌더 유발 없이 묶어 반환. */
export function useStorageMutations() {
  const createFolder = useStorageStore((s) => s.createFolder)
  const updateFolder = useStorageStore((s) => s.updateFolder)
  const deleteFolder = useStorageStore((s) => s.deleteFolder)
  const addImages = useStorageStore((s) => s.addImages)
  const updateImage = useStorageStore((s) => s.updateImage)
  const moveImage = useStorageStore((s) => s.moveImage)
  const deleteImage = useStorageStore((s) => s.deleteImage)
  const createMemo = useStorageStore((s) => s.createMemo)
  const updateMemo = useStorageStore((s) => s.updateMemo)
  const deleteMemo = useStorageStore((s) => s.deleteMemo)
  const saveTemplateKeys = useStorageStore((s) => s.saveTemplateKeys)
  return {
    createFolder,
    updateFolder,
    deleteFolder,
    addImages,
    updateImage,
    moveImage,
    deleteImage,
    createMemo,
    updateMemo,
    deleteMemo,
    saveTemplateKeys,
  }
}
