import { create } from 'zustand'
import type { BoardPosition, BoardRow } from '@bconnect/features'

export interface PerPhoto {
  rows: BoardRow[]
  position: BoardPosition
  description: string
  folderId?: string
  deselected: boolean
}

interface UploadState {
  files: File[]
  /** 공통 보드(모든 사진에 기본 적용). */
  sharedRows: BoardRow[]
  /** 사진별(인덱스) 오버라이드. */
  perPhoto: Record<number, PerPhoto>
  targetFolderId?: string
  setFiles: (files: File[]) => void
  setSharedRows: (rows: BoardRow[]) => void
  setPerPhoto: (index: number, patch: Partial<PerPhoto>) => void
  setTargetFolder: (folderId: string) => void
  reset: () => void
}

/**
 * career 동산보드 업로드 위저드 cross-step state (signup-store 패턴).
 * select(파일) → board(공통 보드) → photos(사진별 배치) 단계가 공유. 완료 시 reset.
 */
export const useUploadStore = create<UploadState>()((set) => ({
  files: [],
  sharedRows: [],
  perPhoto: {},
  targetFolderId: undefined,
  setFiles: (files) => set({ files }),
  setSharedRows: (sharedRows) => set({ sharedRows }),
  setPerPhoto: (index, patch) =>
    set((s) => {
      const base: PerPhoto = s.perPhoto[index] ?? {
        rows: s.sharedRows,
        position: 'tl',
        description: '',
        folderId: s.targetFolderId,
        deselected: false,
      }
      return { perPhoto: { ...s.perPhoto, [index]: { ...base, ...patch } } }
    }),
  setTargetFolder: (targetFolderId) => set({ targetFolderId }),
  reset: () => set({ files: [], sharedRows: [], perPhoto: {}, targetFolderId: undefined }),
}))
