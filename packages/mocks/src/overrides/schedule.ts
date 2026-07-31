import {
  getCancelOfferMockHandler,
  getCreateOfferMockHandler,
  getCreateTaskCompanyMockHandler,
  getGetProjectsMockHandler,
  getGetProjectTasksMockHandler,
  getGetTaskOffersMockHandler,
  getReorderOffersMockHandler,
  getUpdateTaskCompanyMockHandler,
  OfferStatus,
  ProfileRole,
  Role,
  TaskStatus,
  TaskType,
  Trade,
} from '@bconnect/api-client'
import type {
  CreateOfferRequest,
  CreateProjectTaskRequest,
  Offer,
  Project,
  Region,
  ReorderOfferRequest,
  Task,
  UpdateProjectTaskRequest,
} from '@bconnect/api-client'
import { addressOf } from './_address'
import { http, HttpResponse } from 'msw'

/**
 * plan 공정표(projects/project-tasks/offers) **stateful** mock (#767).
 * 생성/수정/삭제/섭외가 모듈 메모리에 반영돼 재조회 시 즉시 보인다. 하드 리로드 시 시드 리셋.
 *
 * BE 실동작 모사:
 * - createByCompany 는 status DRAFT 고정 생성 (BE 에 OPEN/OFFERED 전이 코드 없음)
 * - getTaskOffers 는 ACTIVE+PENDING 만 seq asc 반환
 * - offer create: seq=max+1 PENDING, ACTIVE 없으면 첫 PENDING 자동 승격 (promoteNext)
 * - cancel: PENDING/ACTIVE 모두 취소 가능 + promoteNext
 * - reorder: 해당 task 의 PENDING 전체 offerIds 필수, seq 는 ACTIVE 다음부터 재부여
 *
 * 날짜는 오늘 기준 상대 오프셋으로 동적 생성 (달 경계 교차 케이스 유지).
 * 탐색(profiles) mock 과 회원 상태는 분리 — mock 간 크로스 정합은 비목표.
 */

const pad = (n: number) => String(n).padStart(2, '0')

function isoDaysFromToday(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function nowStamp(): string {
  return new Date().toISOString().slice(0, 19) + 'Z'
}

const seedStamp = nowStamp()

const PROJECT_SEEDS: Project[] = [
  {
    id: 1,
    companyId: 1,
    title: '모튼아파트 리모델링 01 (Mocked)',
    address: addressOf('경기', '수원시 장안구', '경기도 수원시 율전로 00번길 00-00', '000호'),
    createdAt: seedStamp,
    modifiedAt: seedStamp,
  },
  {
    id: 2,
    companyId: 1,
    title: '래미안 리모델링 02 (Mocked)',
    address: addressOf('서울', '강남구', '서울 강남구 테헤란로 00길 00', '0000호'),
    createdAt: seedStamp,
    modifiedAt: seedStamp,
  },
  {
    id: 3,
    companyId: 1,
    title: '자담 사옥 인테리어 (Mocked)',
    address: addressOf('인천', '연수구', '인천 연수구 송도과학로 00', '000호'),
    createdAt: seedStamp,
    modifiedAt: seedStamp,
  },
]

/** 섭외 대기열/대표 기술자 표시용 인물 시드 — member.id 축 (FE 'profileId' = memberId). */
interface PersonSeed {
  name: string
  region: Region
  trade: Trade
}

const CITY_OF_REGION: Partial<Record<Region, string>> = {
  경기: '성남시 분당구',
  서울: '중구',
  인천: '연수구',
}

const PEOPLE: Record<number, PersonSeed> = {
  1: { name: '이송목 (Mocked)', region: '경기', trade: Trade.WALLPAPER },
  2: { name: '손장수 (Mocked)', region: '서울', trade: Trade.ELECTRICAL },
  3: { name: '홍길동 (Mocked)', region: '인천', trade: Trade.CARPENTRY },
  4: { name: '탁재훈 (Mocked)', region: '경기', trade: Trade.TILING },
  5: { name: '송중기 (Mocked)', region: '서울', trade: Trade.FILM_SHEET },
  6: { name: '박세리 (Mocked)', region: '인천', trade: Trade.PAINTING },
  7: { name: '최수종 (Mocked)', region: '경기', trade: Trade.WATERPROOFING },
  21: { name: '김철수 (Mocked)', region: '서울', trade: Trade.DEMOLITION },
  22: { name: '이영희 (Mocked)', region: '경기', trade: Trade.TILING },
  23: { name: '박민수 (Mocked)', region: '인천', trade: Trade.WALLPAPER },
  902: { name: '이민호 (Mocked)', region: '서울', trade: Trade.TILING },
  903: { name: '김태현 (Mocked)', region: '인천', trade: Trade.WALLPAPER },
  904: { name: '박지성 (Mocked)', region: '경기', trade: Trade.TILING },
}

interface TaskSeed {
  id: number
  projectId: number
  trades: Trade[]
  title: string
  startOffset: number
  endOffset: number
  status: Task['status']
  /** SCHEDULED 이상(섭외 확정)의 대표 기술자 */
  workerId?: number
  requirement?: string
  memo?: string
  /** ACTIVE 1건 우선, 나머지 PENDING (memberId 목록) */
  activeOffer?: number
  pendingOffers?: number[]
}

const TASK_SEEDS: TaskSeed[] = [
  {
    id: 8001,
    projectId: 1,
    trades: [Trade.DEMOLITION],
    title: '철거작업',
    startOffset: -6,
    endOffset: -4,
    status: TaskStatus.COMPLETED,
    workerId: 1,
  },
  {
    id: 8002,
    projectId: 1,
    trades: [Trade.ELECTRICAL],
    title: '전기 시공',
    startOffset: -3,
    endOffset: -1,
    status: TaskStatus.IN_PROGRESS,
    workerId: 2,
  },
  {
    id: 8003,
    projectId: 1,
    trades: [Trade.CARPENTRY, Trade.GLAZING],
    title: '목재/창호 설치',
    startOffset: -1,
    endOffset: 0,
    status: TaskStatus.IN_PROGRESS,
    workerId: 3,
  },
  {
    id: 8004,
    projectId: 1,
    trades: [Trade.TILING, Trade.WALLPAPER],
    title: '타일',
    startOffset: 0,
    endOffset: 1,
    status: TaskStatus.SCHEDULED,
    workerId: 4,
    requirement: '타일 시공 및 단일 벽면 일부 도배',
    memo: '세밀한 작업이 필요함',
    pendingOffers: [902, 903, 904],
  },
  {
    id: 8005,
    projectId: 1,
    trades: [Trade.FILM_SHEET],
    title: '필름',
    startOffset: 2,
    endOffset: 3,
    status: TaskStatus.SCHEDULED,
    workerId: 5,
  },
  {
    id: 8006,
    projectId: 1,
    trades: [Trade.WALLPAPER],
    title: '도배',
    startOffset: 4,
    endOffset: 5,
    status: TaskStatus.SCHEDULED,
    workerId: 6,
  },
  {
    id: 8007,
    projectId: 1,
    trades: [Trade.HARDWOOD],
    title: '바닥 및 마무리',
    startOffset: 6,
    endOffset: 7,
    status: TaskStatus.OFFERED,
    activeOffer: 7,
  },
  {
    id: 8008,
    projectId: 1,
    trades: [Trade.SINK, Trade.FURNITURE],
    title: '가구 설치',
    startOffset: 8,
    endOffset: 9,
    status: TaskStatus.DRAFT,
  },
  {
    id: 8009,
    projectId: 1,
    trades: [Trade.ELECTRICAL],
    title: '조명 설치',
    startOffset: 8,
    endOffset: 10,
    status: TaskStatus.DRAFT,
  },
  {
    id: 8010,
    projectId: 2,
    trades: [Trade.DEMOLITION],
    title: '철거',
    startOffset: -2,
    endOffset: 0,
    status: TaskStatus.IN_PROGRESS,
    workerId: 21,
  },
  {
    id: 8011,
    projectId: 2,
    trades: [Trade.TILING],
    title: '타일 시공',
    startOffset: 1,
    endOffset: 4,
    status: TaskStatus.OFFERED,
    activeOffer: 22,
  },
  {
    id: 8012,
    projectId: 3,
    trades: [Trade.ELECTRICAL],
    title: '전기 배선',
    startOffset: 2,
    endOffset: 5,
    status: TaskStatus.DRAFT,
  },
  {
    id: 8013,
    projectId: 3,
    trades: [Trade.WALLPAPER],
    title: '도배',
    startOffset: 6,
    endOffset: 8,
    status: TaskStatus.SCHEDULED,
    workerId: 23,
  },
]

function buildSeedTasks(): Task[] {
  const stamp = nowStamp()
  return TASK_SEEDS.map((seed) => {
    const project = PROJECT_SEEDS.find((p) => p.id === seed.projectId)
    return {
      id: seed.id,
      type: TaskType.PROJECT,
      status: seed.status,
      trades: seed.trades,
      start: isoDaysFromToday(seed.startOffset),
      end: isoDaysFromToday(seed.endOffset),
      workerId: seed.workerId ?? null,
      workerTitle: null,
      workerMemo: null,
      workerCompany: null,
      projectId: seed.projectId,
      projectTitle: seed.title,
      projectRequirement: seed.requirement ?? '요청사항 (Mocked)',
      projectMemo: seed.memo ?? '메모 (Mocked)',
      projectCompanyId: project?.companyId ?? null,
      projectCompanyName: project ? `${project.title} 시공사 (Mocked)` : null,
      address: project?.address ?? null,
      offer: null,
      createdAt: stamp,
      modifiedAt: stamp,
    }
  })
}

function offerOf(
  id: number,
  taskId: number,
  memberId: number,
  seq: number,
  status: Offer['status']
): Offer {
  const person = PEOPLE[memberId]
  const stamp = nowStamp()
  return {
    id,
    taskId,
    seq,
    status,
    member: {
      id: memberId,
      username: `worker_${memberId}`,
      name: person?.name ?? `기술자 ${memberId} (Mocked)`,
      picture: null,
    },
    profile: {
      role: ProfileRole.SKILLED,
      primaryTrade: person?.trade ?? Trade.TILING,
      experience: 3,
      headline: null,
      address: addressOf(
        person?.region ?? '서울',
        CITY_OF_REGION[person?.region ?? '서울'] ?? '중구'
      ),
    },
    createdAt: stamp,
    modifiedAt: stamp,
  }
}

function buildSeedOffers(): Offer[] {
  const out: Offer[] = []
  let id = 8500
  for (const seed of TASK_SEEDS) {
    let seq = 1
    if (seed.activeOffer != null)
      out.push(offerOf(id++, seed.id, seed.activeOffer, seq++, OfferStatus.ACTIVE))
    for (const memberId of seed.pendingOffers ?? []) {
      out.push(offerOf(id++, seed.id, memberId, seq++, OfferStatus.PENDING))
    }
  }
  return out
}

// 모듈 메모리 상태 — 핸들러 공유. 하드 리로드 시 시드 리셋.
const projects: Project[] = PROJECT_SEEDS
let tasks: Task[] = buildSeedTasks()
let offers: Offer[] = buildSeedOffers()
let nextTaskId = 8100
let nextOfferId = 8600

const taskOffers = (taskId: number) => offers.filter((o) => o.taskId === taskId)

/** ACTIVE 가 없으면 첫 PENDING(최소 seq)을 ACTIVE 로 승격 — BE OfferService.promoteNext 모사. */
function promoteNext(taskId: number) {
  const list = taskOffers(taskId)
  if (list.some((o) => o.status === OfferStatus.ACTIVE)) return
  const next = list
    .filter((o) => o.status === OfferStatus.PENDING)
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))[0]
  if (next) next.status = OfferStatus.ACTIVE
}

export const scheduleOverrides = [
  getGetProjectsMockHandler((): Project[] => projects),

  // 없는 프로젝트도 실제 BE처럼 C005/404로 내려 QA 흐름을 가리지 않는다.
  http.get('*/api/v1/projects/:id', ({ params }) => {
    const project = projects.find((p) => p.id === Number(params.id))
    if (!project) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'C005', message: '요청한 리소스를 찾을 수 없습니다.' },
        },
        { status: 404 }
      )
    }
    return HttpResponse.json(project)
  }),

  getGetProjectTasksMockHandler((info): Task[] =>
    tasks.filter((t) => t.projectId === Number(info.params.id))
  ),

  getCreateTaskCompanyMockHandler(async (info): Promise<number> => {
    const body = (await info.request.json()) as CreateProjectTaskRequest
    const id = nextTaskId++
    const stamp = nowStamp()
    tasks.push({
      id,
      type: TaskType.PROJECT,
      // BE createByCompany 실동작: DRAFT 고정 생성 (상태 전이는 assign→SCHEDULED 뿐)
      status: TaskStatus.DRAFT,
      trades: body.trades,
      start: body.start,
      end: body.end,
      workerId: null,
      workerTitle: null,
      workerMemo: null,
      workerCompany: null,
      projectId: body.projectId,
      projectTitle: body.title,
      projectRequirement: body.requirement,
      projectMemo: body.memo,
      projectCompanyId: projects.find((p) => p.id === body.projectId)?.companyId ?? null,
      projectCompanyName: null,
      address: projects.find((p) => p.id === body.projectId)?.address ?? null,
      offer: null,
      createdAt: stamp,
      modifiedAt: stamp,
    })
    return id
  }),

  getUpdateTaskCompanyMockHandler(async (info) => {
    const id = Number(info.params.id)
    const body = (await info.request.json()) as UpdateProjectTaskRequest
    tasks = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            trades: body.trades,
            start: body.start,
            end: body.end,
            projectTitle: body.title,
            projectRequirement: body.requirement,
            projectMemo: body.memo,
            modifiedAt: nowStamp(),
          }
        : t
    )
    return { success: true }
  }),

  // DELETE /tasks/{id} 는 career 캘린더 overrides/tasks.ts 와 엔드포인트 중복.
  // generated 래퍼는 fall-through(undefined) 불가라 raw 핸들러 — 내 task 아니면 뒤(tasks.ts)로 넘김.
  // (raw 라 openapi drift 컴파일 가드는 없음 — 경로 변경 시 수동 정합 필요)
  http.delete('*/api/v1/tasks/:id', ({ params }) => {
    const id = Number(params.id)
    if (!tasks.some((t) => t.id === id)) return undefined
    tasks = tasks.filter((t) => t.id !== id)
    offers = offers.filter((o) => o.taskId !== id)
    return HttpResponse.json({ success: true })
  }),

  // BE OfferService.listByTask 모사 — ACTIVE+PENDING 만 seq asc
  getGetTaskOffersMockHandler((info): Offer[] =>
    taskOffers(Number(info.params.id))
      .filter((o) => o.status === OfferStatus.ACTIVE || o.status === OfferStatus.PENDING)
      .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
  ),

  getCreateOfferMockHandler(async (info): Promise<number> => {
    const body = (await info.request.json()) as CreateOfferRequest
    const list = taskOffers(body.taskId)
    const maxSeq = Math.max(0, ...list.map((o) => o.seq ?? 0))
    const id = nextOfferId++
    offers.push(offerOf(id, body.taskId, body.workerId, maxSeq + 1, OfferStatus.PENDING))
    promoteNext(body.taskId)
    return id
  }),

  getCancelOfferMockHandler((info) => {
    const id = Number(info.params.id)
    const offer = offers.find((o) => o.id === id)
    if (offer) {
      offer.status = OfferStatus.CANCELED
      promoteNext(offer.taskId!)
    }
    return { success: true }
  }),

  // BE OfferService.reorder 모사 — PENDING 전체 offerIds 필수, seq 는 ACTIVE 최대 seq 다음부터
  getReorderOffersMockHandler(async (info) => {
    const body = (await info.request.json()) as ReorderOfferRequest
    const first = offers.find((o) => o.id === body.offerIds[0])
    if (!first) return { success: false }
    const list = taskOffers(first.taskId!)
    const pendingIds = new Set(
      list.filter((o) => o.status === OfferStatus.PENDING).flatMap((o) => o.id ?? [])
    )
    const requested = new Set(body.offerIds)
    if (pendingIds.size !== requested.size || [...pendingIds].some((v) => !requested.has(v)))
      return { success: false }
    const activeMax = Math.max(
      0,
      ...list.filter((o) => o.status === OfferStatus.ACTIVE).map((o) => o.seq ?? 0)
    )
    body.offerIds.forEach((offerId, i) => {
      const offer = offers.find((o) => o.id === offerId)
      if (offer) offer.seq = activeMax + 1 + i
    })
    return { success: true }
  }),
]
