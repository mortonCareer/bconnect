import { create } from 'zustand'
import type {
  BoardImage,
  BoardPosition,
  BoardRow,
  Folder,
  Memo,
  MetaTemplate,
} from '@bconnect/features'
import { SEED_FOLDERS, SEED_IMAGES, SEED_MEMOS, SEED_TEMPLATE } from './seed'

export interface AddImageInput {
  imageUrl: string
  boardRows: BoardRow[]
  boardPosition: BoardPosition
  description: string
}

export type ImagePatch = Partial<Pick<BoardImage, 'boardRows' | 'boardPosition' | 'description'>>

interface StorageMockState {
  folders: Folder[]
  images: BoardImage[]
  memos: Memo[]
  template: MetaTemplate
  createFolder: (input: { projectId: string; title: string }) => Folder
  updateFolder: (id: string, patch: { title: string }) => void
  deleteFolder: (id: string) => void
  addImages: (folderId: string, items: AddImageInput[]) => void
  updateImage: (id: string, patch: ImagePatch) => void
  moveImage: (id: string, toFolderId: string) => void
  deleteImage: (id: string) => void
  createMemo: (folderId: string, content: string) => Memo
  updateMemo: (id: string, content: string) => void
  deleteMemo: (id: string) => void
  saveTemplateKeys: (keys: string[]) => void
}

const uid = (): string => crypto.randomUUID()
const now = (): string => new Date().toISOString()

/** 폴더의 fileCount/coverImageUrl 를 images 기준으로 재계산. */
function withFolderDerived(folders: Folder[], images: BoardImage[]): Folder[] {
  return folders.map((f) => {
    const imgs = images.filter((i) => i.folderId === f.id)
    return { ...f, fileCount: imgs.length, coverImageUrl: imgs[0]?.imageUrl }
  })
}

/**
 * 공유 저장소 / 동산보드 로컬 mock 단일 store (BE 미구현 — 순수 클라 인메모리).
 * BE 연동 시 lib/storage-mock/hooks.ts 를 @bconnect/api-client generated hook 으로 교체 + 이 store 삭제.
 * 소비처(features *View 어댑터) 시그니처는 hooks.ts 가 흡수하므로 무변경.
 */
export const useStorageStore = create<StorageMockState>()((set) => ({
  folders: withFolderDerived(SEED_FOLDERS, SEED_IMAGES),
  images: SEED_IMAGES,
  memos: SEED_MEMOS,
  template: SEED_TEMPLATE,

  createFolder: ({ projectId, title }) => {
    const folder: Folder = { id: uid(), projectId, title, createdAt: now(), fileCount: 0 }
    set((s) => ({ folders: [folder, ...s.folders] }))
    return folder
  },
  updateFolder: (id, patch) =>
    set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
  deleteFolder: (id) =>
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== id),
      images: s.images.filter((i) => i.folderId !== id),
      memos: s.memos.filter((m) => m.folderId !== id),
    })),

  addImages: (folderId, items) =>
    set((s) => {
      const created: BoardImage[] = items.map((it) => ({
        id: uid(),
        folderId,
        createdAt: now(),
        ...it,
      }))
      const images = [...s.images, ...created]
      return { images, folders: withFolderDerived(s.folders, images) }
    }),
  updateImage: (id, patch) =>
    set((s) => ({ images: s.images.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
  moveImage: (id, toFolderId) =>
    set((s) => {
      const images = s.images.map((i) => (i.id === id ? { ...i, folderId: toFolderId } : i))
      return { images, folders: withFolderDerived(s.folders, images) }
    }),
  deleteImage: (id) =>
    set((s) => {
      const images = s.images.filter((i) => i.id !== id)
      return { images, folders: withFolderDerived(s.folders, images) }
    }),

  createMemo: (folderId, content) => {
    const memo: Memo = { id: uid(), folderId, content, createdAt: now() }
    set((s) => ({ memos: [memo, ...s.memos] }))
    return memo
  },
  updateMemo: (id, content) =>
    set((s) => ({ memos: s.memos.map((m) => (m.id === id ? { ...m, content } : m)) })),
  deleteMemo: (id) => set((s) => ({ memos: s.memos.filter((m) => m.id !== id) })),

  saveTemplateKeys: (keys) => set(() => ({ template: { keys } })),
}))
