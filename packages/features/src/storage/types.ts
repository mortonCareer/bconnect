/**
 * 공유 저장소 / 동산보드 도메인 FE-provisional 타입 — BE 미구현(storage/attachment/memo 스펙·엔드포인트 부재).
 * 이 파일이 잠정 SSOT. file-infra 스펙(docs/reference/specs/2026-04-12-file-infrastructure-design.md §4.2)의
 * Storage(=폴더, 1-depth flat) + Attachment(=파일) 모델을 FE 표현 계약으로 구체화.
 * TODO(BE storage 도메인): 스펙 확정 시 orval generated 타입으로 교체. 그때 *View 컴포넌트는 무변경,
 *   앱 어댑터의 데이터소스(lib/storage-mock)만 교체.
 */

/** 동산보드 스탬프가 사진 위 어느 코너에 붙는지. */
export type BoardPosition = 'tl' | 'tr' | 'bl' | 'br'

/** 동산보드 메타데이터 한 행 (유저정의 key-value). */
export interface BoardRow {
  key: string
  value: string
}

/** 폴더 = Storage(type=PROJECT). 1-depth flat, 중첩 없음. */
export interface Folder {
  id: string
  projectId: string
  title: string
  createdAt: string // ISO
  coverImageUrl?: string // 탐색기 썸네일용 (첫 이미지)
  fileCount: number // 파생 — 이미지 추가/이동/삭제 시 store 가 동기화
}

/** 사진 + 동산보드 = Attachment + 메타/위치/설명. */
export interface BoardImage {
  id: string
  folderId: string
  imageUrl: string
  filename?: string
  boardRows: BoardRow[]
  boardPosition: BoardPosition
  description: string
  createdAt: string
}

/** 폴더별 메모 (= 게시판). BE/file-infra 스펙에 없음 — 신규 도메인. */
export interface Memo {
  id: string
  folderId: string
  createdAt: string
  content: string
}

/** 저장소 사용량 (용량바). mock 파생. */
export interface StorageUsage {
  usedBytes: number
  totalBytes: number
}

/** react-query 형태 결과 — 미래 orval swap 시 기계적 교체용. */
export interface QueryResult<T> {
  data: T | undefined
  isLoading: boolean
  isError: boolean
}
