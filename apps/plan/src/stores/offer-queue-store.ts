import { create } from 'zustand'

/** 대기중(큐만, 정렬·삭제) | 섭외중(발송됨, 취소만·정렬잠금). 미래 BE enum 매핑. */
export type OfferStatus = 'waiting' | 'offered'

/**
 * 섭외 대기열 항목. schedule TaskAssignee 동형(profileId/name/region/level/specialty) + status/picture.
 * 미래 API 리소스(Offer)와 1:1 — taskId(FK)는 queues 맵 키, 배열 순서가 곧 정렬 순서(미래 sortOrder).
 */
export interface OfferQueueItem {
  profileId: number
  name: string
  region: string
  level: string
  specialty: string
  picture?: string
  status: OfferStatus
}

interface OfferQueueState {
  queues: Record<string, OfferQueueItem[]>
  addToQueue: (taskId: string, item: OfferQueueItem) => void
  removeFromQueue: (taskId: string, profileId: number) => void
  reorderQueue: (taskId: string, activeProfileId: number, overProfileId: number) => void
}

/** Figma 노드2(1572-13227) 재현 — 타일 작업(id '4')에 섭외중 1 + 대기중 4. BE 연동 시 제거. */
const MOCK_OFFER_QUEUES: Record<string, OfferQueueItem[]> = {
  '4': [
    {
      profileId: 901,
      name: '최수종 (Mocked)',
      region: '경기도',
      level: '준기공',
      specialty: '방수',
      status: 'offered',
    },
    {
      profileId: 902,
      name: '이민호 (Mocked)',
      region: '서울',
      level: '반장',
      specialty: '타일',
      status: 'waiting',
    },
    {
      profileId: 903,
      name: '김태현 (Mocked)',
      region: '인천',
      level: '기공',
      specialty: '도배',
      status: 'waiting',
    },
    {
      profileId: 904,
      name: '박지성 (Mocked)',
      region: '경기도',
      level: '준기공',
      specialty: '타일',
      status: 'waiting',
    },
    {
      profileId: 905,
      name: '정재영 (Mocked)',
      region: '서울',
      level: '기공',
      specialty: '방수',
      status: 'waiting',
    },
  ],
}

/**
 * 섭외 대기열 로컬 상태 seam (#575). 탐색(섭외 제안)·작업 패널·큐 패널이 같은 queues 를 공유한다.
 * 소비는 useOfferQueue facade 경유 — BE 연동 시 facade 만 React Query mutation 으로 교체, 이 store 삭제.
 */
export const useOfferQueueStore = create<OfferQueueState>()((set) => ({
  queues: MOCK_OFFER_QUEUES,
  addToQueue: (taskId, item) =>
    set((s) => {
      const cur = s.queues[taskId] ?? []
      if (cur.some((q) => q.profileId === item.profileId)) return s
      return { queues: { ...s.queues, [taskId]: [...cur, { ...item, status: 'waiting' }] } }
    }),
  removeFromQueue: (taskId, profileId) =>
    set((s) => {
      const cur = s.queues[taskId]
      if (!cur) return s
      return { queues: { ...s.queues, [taskId]: cur.filter((q) => q.profileId !== profileId) } }
    }),
  reorderQueue: (taskId, activeProfileId, overProfileId) =>
    set((s) => {
      const cur = s.queues[taskId]
      if (!cur || activeProfileId === overProfileId) return s
      const from = cur.findIndex((q) => q.profileId === activeProfileId)
      const to = cur.findIndex((q) => q.profileId === overProfileId)
      if (from < 0 || to < 0) return s
      if (cur[from].status !== 'waiting' || cur[to].status !== 'waiting') return s
      const next = cur.slice()
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return { queues: { ...s.queues, [taskId]: next } }
    }),
}))
