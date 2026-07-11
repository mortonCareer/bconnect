import type { BoardImage, BoardPosition, Folder, Memo, MetaTemplate } from '@bconnect/features'

// 보드 스탬프 위치 — 사실감 위해 코너 섞음(전부 좌상단 통일 X).
const SEED_POSITIONS: BoardPosition[] = ['tl', 'br', 'tr', 'bl', 'tr', 'br']

/** 시안의 회색 "이미지" 박스를 그대로 재현하는 self-contained placeholder (네트워크/파일 불필요, refresh 생존). */
export const placeholderImage = (label = '이미지'): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#e5e5e5"/><text x="50%" y="50%" font-size="28" fill="#a5a5a5" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  )}`

const MEMO_BODY = `[ 작업시 주의사항 ]
작업 시간
• 평일 08:00~18:00, 토요일 08:00~16:00
• 일요일·공휴일 작업 불가
작업 중 주의
• 물 사용 작업(타일·설비) 전 아래층 사전 고지 및 방수 상태 사진 촬영
• 공용 복도·계단 자재 적치 금지
작업 후 정리
• 폐자재 관리사무소 지정 장소에만 배출
• 작업 완료 후 공용부 청소 상태 확인`

// projectId 는 MSW 공정표 시드(packages/mocks overrides/schedule.ts) 프로젝트 id 에 정렬.
// fileCount/coverImageUrl 는 store 초기화 시 SEED_IMAGES 기준으로 재계산되므로 0/undefined 로 둠.
export const SEED_FOLDERS: Folder[] = [
  {
    id: 'living',
    projectId: '1',
    title: '거실 (Mocked)',
    createdAt: '2026-02-23T00:00:00.000Z',
    fileCount: 0,
  },
  {
    id: 'veranda',
    projectId: '1',
    title: '베란다 (Mocked)',
    createdAt: '2026-01-14T00:00:00.000Z',
    fileCount: 0,
  },
  {
    id: 'bedroom',
    projectId: '1',
    title: '침실 (Mocked)',
    createdAt: '2025-11-20T00:00:00.000Z',
    fileCount: 0,
  },
  {
    id: 'bath',
    projectId: '1',
    title: '화장실 (Mocked)',
    createdAt: '2025-11-01T00:00:00.000Z',
    fileCount: 0,
  },
  {
    id: 'r2-demo',
    projectId: '2',
    title: '철거 현장 (Mocked)',
    createdAt: '2026-03-02T00:00:00.000Z',
    fileCount: 0,
  },
]

const livingRows = (loc: string) => [
  { key: '공사명', value: '모튼아파트 리모델링 01 (Mocked)' },
  { key: '내용', value: '도배 / 실크벽지 시공 (Mocked)' },
  { key: '위치', value: loc },
  { key: '일자', value: '2026.02.21' },
]

export const SEED_IMAGES: BoardImage[] = Array.from({ length: 6 }, (_, i) => ({
  id: `living-img-${i + 1}`,
  folderId: 'living',
  imageUrl: placeholderImage(`이미지 ${i + 1}`),
  boardRows: livingRows(
    `101동 1502호 ${['거실', '거실 창측', '주방', '복도', '베란다 입구', '현관'][i]} (Mocked)`
  ),
  boardPosition: SEED_POSITIONS[i],
  description: '',
  createdAt: `2026-02-2${i}T00:00:00.000Z`,
}))

export const SEED_MEMOS: Memo[] = [
  { id: 'memo-1', folderId: 'living', content: MEMO_BODY, createdAt: '2025-09-22T00:00:00.000Z' },
  { id: 'memo-2', folderId: 'living', content: MEMO_BODY, createdAt: '2025-09-22T01:00:00.000Z' },
]

// 동산보드 행 제목 템플릿 — 다음 업로드에도 기억됨.
export const SEED_TEMPLATE: MetaTemplate = { keys: ['공사명', '내용', '위치', '일자'] }
