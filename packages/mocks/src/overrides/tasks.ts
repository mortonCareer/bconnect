import {
  getCreateTaskWorkerMockHandler,
  getDeleteTaskMockHandler,
  getGetTasksMockHandler,
  getUpdateTaskWorkerMockHandler,
  TaskStatus,
  TaskType,
  Trade,
} from '@bconnect/api-client'
import type {
  Address,
  CreateWorkerTaskRequest,
  Task,
  UpdateWorkerTaskRequest,
} from '@bconnect/api-client'

/**
 * 캘린더(#650) QA 시드 + **stateful** mock. 생성/수정/삭제가 모듈 메모리에 반영돼
 * getTasks 재조회 시 캘린더에 즉시 보인다 (실 BE 동작 모사). 하드 리로드 시 SEED 로 리셋.
 *
 * 현재 월에 앵커. 커버: 멀티데이 + 주(週) 경계 교차, 한 날 3중첩(레인/오버플로), 제안작업, 단기.
 * 제안작업(업체 제안, 미수락) = type PROJECT + status OFFERED (mapper 가 offer/status 로 isProposed 파생).
 * 본인 작업 = type WORKER (canManage true). getTasks 는 파라미터 없이 전량 반환, FE 가 월 필터.
 */

const pad = (n: number) => String(n).padStart(2, '0')

function isoOfDay(year: number, month1: number, day: number): string {
  return `${year}-${pad(month1)}-${pad(day)}`
}

const SAMPLE_ADDRESS: Address = {
  zipcode: '16677',
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

function buildSeedTasks(): Task[] {
  const now = new Date()
  const year = now.getFullYear()
  const month1 = now.getMonth() + 1
  const stamp = nowStamp()
  return SEEDS.map((seed): Task => {
    const base = {
      id: seed.id,
      trades: seed.trades,
      address: SAMPLE_ADDRESS,
      start: isoOfDay(year, month1, seed.startDay),
      end: isoOfDay(year, month1, seed.endDay),
      workerId: null,
      workerTitle: null,
      workerMemo: null,
      workerCompany: null,
      projectId: null,
      projectTitle: null,
      projectRequirement: null,
      projectMemo: null,
      offer: null,
      createdAt: stamp,
      modifiedAt: stamp,
    }
    if (seed.proposed) {
      // 업체 제안작업(미수락) — PROJECT 타입 + OFFERED
      return {
        ...base,
        type: TaskType.PROJECT,
        status: TaskStatus.OFFERED,
        projectTitle: seed.title,
        workerCompany: seed.company,
      }
    }
    return {
      ...base,
      type: TaskType.WORKER,
      status: TaskStatus.SCHEDULED,
      workerTitle: seed.title,
      workerCompany: seed.company,
    }
  })
}

// 모듈 메모리 상태 — 핸들러들이 공유(closure가 변수 바인딩 캡처). 하드 리로드 시 재초기화.
let tasks: Task[] = buildSeedTasks()
let nextId = 9100

export const tasksOverrides = [
  getGetTasksMockHandler((): Task[] => tasks),

  getCreateTaskWorkerMockHandler(async (info): Promise<number> => {
    const body = (await info.request.json()) as CreateWorkerTaskRequest
    const id = nextId++
    const stamp = nowStamp()
    tasks.push({
      id,
      type: TaskType.WORKER,
      status: TaskStatus.SCHEDULED,
      trades: body.trades,
      start: body.start,
      end: body.end,
      workerId: null,
      workerTitle: body.title,
      workerMemo: body.memo ?? null,
      workerCompany: body.company ?? null,
      address: body.address ?? null,
      projectId: null,
      projectTitle: null,
      projectRequirement: null,
      projectMemo: null,
      offer: null,
      createdAt: stamp,
      modifiedAt: stamp,
    })
    return id
  }),

  getUpdateTaskWorkerMockHandler(async (info) => {
    const id = Number(info.params.id)
    const body = (await info.request.json()) as UpdateWorkerTaskRequest
    const stamp = nowStamp()
    tasks = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            trades: body.trades,
            start: body.start,
            end: body.end,
            workerTitle: body.title,
            workerMemo: body.memo ?? null,
            workerCompany: body.company ?? null,
            address: body.address ?? null,
            modifiedAt: stamp,
          }
        : t
    )
    return { success: true }
  }),

  getDeleteTaskMockHandler((info) => {
    const id = Number(info.params.id)
    tasks = tasks.filter((t) => t.id !== id)
    return { success: true }
  }),
]
