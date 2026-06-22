import { create } from 'zustand'
import type { BoardRow } from '@bconnect/features'

interface UploadState {
  files: File[]
  /** 공통 보드(선택 사진 전체에 적용). */
  sharedRows: BoardRow[]
  targetFolderId?: string
  setFiles: (files: File[]) => void
  setSharedRows: (rows: BoardRow[]) => void
  setTargetFolder: (folderId: string) => void
  reset: () => void
}

/**
 * career 저장소 업로드 cross-step state. 흐름: OS 다중선택 → board(공통 보드) → 완료 커밋.
 * 사진별 세부(위치/메타/설명/삭제)는 업로드 후 갤러리 상세에서 — 별도 photos 스텝 제거.
 */
export const useUploadStore = create<UploadState>()((set) => ({
  files: [],
  sharedRows: [],
  targetFolderId: undefined,
  setFiles: (files) => set({ files }),
  setSharedRows: (sharedRows) => set({ sharedRows }),
  setTargetFolder: (targetFolderId) => set({ targetFolderId }),
  reset: () => set({ files: [], sharedRows: [], targetFolderId: undefined }),
}))
