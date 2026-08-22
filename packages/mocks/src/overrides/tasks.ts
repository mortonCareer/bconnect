import {
  getAcceptOfferMockHandler,
  getCreateTaskWorkerMockHandler,
  getDeleteTaskMockHandler,
  getDenyOfferMockHandler,
  getGetTasksMockHandler,
  getUpdateTaskWorkerMockHandler,
  OfferStatus,
  TaskProgress,
  TaskStatus,
  Trade,
} from '@bconnect/api-client'
import type {
  Address,
  AssigneeTask,
  CreateWorkerTaskRequest,
  TaskList,
  UpdateWorkerTaskRequest,
  WorkerTask,
} from '@bconnect/api-client'

/**
 * 캘린더(#650) QA 시드 + **stateful** mock. 생성/수정/삭제가 모듈 메모리에 반영돼
 * getTasks 재조회 시 캘린더에 즉시 보인다 (실 BE 동작 모사). 하드 리로드 시 SEED 로 리셋.
 *
 * 현재 월에 앵커. 커버: 멀티데이 + 주(週) 경계 교차, 한 날 3중첩(레인/오버플로), 제안작업, 단기.
 * #1176 에서 응답이 용도별로 갈렸다 — 제안작업(업체 제안)은 offer 를 물고 오는 assigneeTasks,
 * 본인 작업(canManage true)은 workerTasks. getTasks 는 파라미터 없이 전량 반환, FE 가 월 필터.
 */

const pad = (n: number) => String(n).padStart(2, '0')

function isoOfDay(year: number, month1: number, day: number): string {
  return `${year}-${pad(month1)}-${pad(day)}`
}

const SAMPLE_ADDRESS: Address = {
  zipcode: '16677',
  bcode: '4111100000',
  state: '경기',
  city: '수원시 장안구',
  street: '경기도 수원시 율전로 00번길 00-00',
  detail: '000호',
  latitude: 0,
  longitude: 0,
}

interface TaskSeed {
  id: number
  proposed?: boolean
  company: string
  title: string
  trades: Trade[]
  startDay: number
  endDay: number
  /** 제안작업의 섭외 id — 채팅 OFFER 메시지(chats.ts)의 content 와 맞춘다 (#972) */
  offerId?: number
  /** 제안작업 요청사항 — 채팅 OFFER 카드 표시용 */
  requirement?: string
}

const SEEDS: TaskSeed[] = [
  {
    id: 9001,
    company: '서정 건축',
    title: '외벽 타일·도배',
    trades: [Trade.TILING, Trade.WALLPAPER],
    startDay: 3,
    endDay: 9,
  },
  {
    id: 9002,
    company: '한빛 전기',
    title: '전기 배선',
    trades: [Trade.ELECTRICAL],
    startDay: 9,
    endDay: 11,
  },
  {
    id: 9003,
    company: '대림 설비',
    title: '욕실 방수',
    trades: [Trade.TILING],
    startDay: 9,
    endDay: 9,
  },
  {
    id: 9004,
    proposed: true,
    company: '도담 건설',
    title: '도담 아파트 내부 도배·도장',
    trades: [Trade.WALLPAPER, Trade.PAINTING],
    startDay: 18,
    endDay: 22,
    offerId: 8004,
    requirement: '전체적인 타일 시공과 단일 벽면 일부 도배를 요청드립니다.',
  },
  {
    id: 9005,
    company: '정우 종합',
    title: '외부 도장',
    trades: [Trade.PAINTING],
    startDay: 25,
    endDay: 26,
  },
]

function nowStamp(): string {
  return new Date().toISOString().slice(0, 19) + 'Z'
}

/** WorkerTaskResponse.workerId 는 non-null — mock 기술자 본인 id. */
const MOCK_WORKER_ID = 100
/** AssigneeTaskResponse.projectId 도 non-null — 제안작업이 속한 mock 프로젝트. */
const MOCK_PROJECT_ID = 9500

function buildSeedTasks(): TaskList {
  const now = new Date()
  const year = now.getFullYear()
  const month1 = now.getMonth() + 1
  const stamp = nowStamp()
  const workerTasks: WorkerTask[] = []
  const assigneeTasks: AssigneeTask[] = []
  for (const seed of SEEDS) {
    const base = {
      id: seed.id,
      trades: seed.trades,
      address: SAMPLE_ADDRESS,
      start: isoOfDay(year, month1, seed.startDay),
      end: isoOfDay(year, month1, seed.endDay),
      progress: TaskProgress.TODO,
      title: seed.title,
      memo: null,
      createdAt: stamp,
      modifiedAt: stamp,
    }
    if (seed.proposed) {
      // 업체 제안작업(미수락). offer 가 붙으면 채팅 OFFER 카드가 상세를 읽는다(#972).
      assigneeTasks.push({
        ...base,
        status: TaskStatus.OFFERED,
        workerId: null,
        projectId: MOCK_PROJECT_ID,
        requirement: seed.requirement ?? null,
        offer:
          seed.offerId == null
            ? null
            : { id: seed.offerId, taskId: seed.id, seq: 1, status: OfferStatus.ACTIVE },
      })
      continue
    }
    // 본인 작업 — WorkerTaskResponse 에는 status·offer 가 없다.
    workerTasks.push({ ...base, workerId: MOCK_WORKER_ID, company: seed.company })
  }
  return { workerTasks, assigneeTasks }
}

// 모듈 메모리 상태 — 핸들러들이 공유(closure가 변수 바인딩 캡처). 하드 리로드 시 재초기화.
let tasks: TaskList = buildSeedTasks()
let nextId = 9100

export const tasksOverrides = [
  getGetTasksMockHandler((): TaskList => tasks),

  getCreateTaskWorkerMockHandler(async (info): Promise<number> => {
    const body = (await info.request.json()) as CreateWorkerTaskRequest
    const id = nextId++
    const stamp = nowStamp()
    tasks = {
      ...tasks,
      workerTasks: [
        ...tasks.workerTasks,
        {
          id,
          progress: TaskProgress.TODO,
          trades: body.trades,
          start: body.start,
          end: body.end,
          workerId: MOCK_WORKER_ID,
          title: body.title,
          memo: body.memo ?? null,
          company: body.company ?? null,
          address: body.address ?? null,
          createdAt: stamp,
          modifiedAt: stamp,
        },
      ],
    }
    return id
  }),

  getUpdateTaskWorkerMockHandler(async (info) => {
    const id = Number(info.params.id)
    const body = (await info.request.json()) as UpdateWorkerTaskRequest
    const stamp = nowStamp()
    tasks = {
      ...tasks,
      workerTasks: tasks.workerTasks.map((t) =>
        t.id === id
          ? {
              ...t,
              trades: body.trades,
              start: body.start,
              end: body.end,
              progress: body.progress,
              title: body.title,
              memo: body.memo ?? null,
              company: body.company ?? null,
              address: body.address ?? null,
              modifiedAt: stamp,
            }
          : t
      ),
    }
    return { success: true }
  }),

  getDeleteTaskMockHandler((info) => {
    const id = Number(info.params.id)
    tasks = {
      workerTasks: tasks.workerTasks.filter((t) => t.id !== id),
      assigneeTasks: tasks.assigneeTasks.filter((t) => t.id !== id),
    }
    return { success: true }
  }),

  // 기술자의 섭외 수락/거절(#972) — 채팅 OFFER 카드가 재조회 시 결과 상태를 읽는다.
  // 업체측 섭외 대기열(schedule.ts)은 별도 상태라 여기선 career 쪽 assigneeTasks 만 갱신.
  // 수락해도 목록에서 빼지 않는다 — #1176 이후 GET /tasks 는 ACTIVE 뿐 아니라 ACCEPTED 도 내려준다.
  ...[
    [getAcceptOfferMockHandler, OfferStatus.ACCEPTED, TaskStatus.ASSIGNED] as const,
    [getDenyOfferMockHandler, OfferStatus.DENIED, TaskStatus.NONE] as const,
  ].map(([handler, offerStatus, taskStatus]) =>
    handler((info) => {
      const offerId = Number(info.params.id)
      tasks = {
        ...tasks,
        assigneeTasks: tasks.assigneeTasks.map((t) =>
          t.offer?.id === offerId
            ? { ...t, status: taskStatus, offer: { ...t.offer, status: offerStatus } }
            : t
        ),
      }
      return { success: true }
    })
  ),
]
