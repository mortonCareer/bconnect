import {
  getCreateTaskMockHandler,
  getDeleteTaskMockHandler,
  getGetMyTasksMockHandler,
  getUpdateTaskMockHandler,
  Trade,
} from '@bconnect/api-client'
import type { Address, CreateTaskRequest, Task, UpdateTaskRequest } from '@bconnect/api-client'

/**
 * 캘린더(#650) QA 시드 + **stateful** mock. 생성/수정/삭제가 모듈 메모리에 반영돼
 * getMyTasks 재조회 시 캘린더에 즉시 보인다 (실 BE 동작 모사). 하드 리로드 시 SEED 로 리셋.
 *
 * 현재 월에 앵커. 커버: 멀티데이 + 주(週) 경계 교차, 한 날 3중첩(레인/오버플로), 제안작업, 단기.
 * `profileId === null` = 업체 제안작업(미수락) — FE 가 `제안됨` 으로 파생. status 필드 추가 전까지의 sentinel.
 */

const pad = (n: number) => String(n).padStart(2, '0')

function isoOfDay(year: number, month1: number, day: number): string {
  return `${year}-${pad(month1)}-${pad(day)}`
}

const SAMPLE_ADDRESS: Address = {
  zipcode: '16677',
  state: '경기도',
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
  eventTitle: string
  taskTitle: string
  trades: Trade[]
  startDay: number
  endDay: number
}

const SEEDS: TaskSeed[] = [
  {
    id: 9001,
    company: '서정 건축',
    eventTitle: '서정 전원주택 외벽',
    taskTitle: '외벽 타일·도배',
    trades: [Trade.TILING, Trade.WALLPAPER],
    startDay: 3,
    endDay: 9,
  },
  {
    id: 9002,
    company: '한빛 전기',
    eventTitle: '한빛 상가 전기 배선',
    taskTitle: '전기 배선',
    trades: [Trade.ELECTRICAL],
    startDay: 9,
    endDay: 11,
  },
  {
    id: 9003,
    company: '대림 설비',
    eventTitle: '대림 빌라 욕실 방수',
    taskTitle: '욕실 방수',
    trades: [Trade.TILING],
    startDay: 9,
    endDay: 9,
  },
  {
    id: 9004,
    proposed: true,
    company: '도담 건설',
    eventTitle: '도담 아파트 내부',
    taskTitle: '내부 도배·도장',
    trades: [Trade.WALLPAPER, Trade.PAINTING],
    startDay: 18,
    endDay: 22,
  },
  {
    id: 9005,
    company: '정우 종합',
    eventTitle: '정우 사옥 도장',
    taskTitle: '외부 도장',
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
  return SEEDS.map((seed) => ({
    id: seed.id,
    profileId: seed.proposed ? null : 1,
    company: seed.company,
    address: SAMPLE_ADDRESS,
    taskTitle: seed.taskTitle,
    eventTitle: seed.eventTitle,
    trades: seed.trades,
    start: isoOfDay(year, month1, seed.startDay),
    end: isoOfDay(year, month1, seed.endDay),
    createdAt: stamp,
    modifiedAt: stamp,
  }))
}

// 모듈 메모리 상태 — 핸들러들이 공유(closure가 변수 바인딩 캡처). 하드 리로드 시 재초기화.
let tasks: Task[] = buildSeedTasks()
let nextId = 9100

/** [aStart,aEnd] 와 [bStart,bEnd] 가 겹치면 true (동일 ISO 포맷 문자열 비교). */
function intersects(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

export const tasksOverrides = [
  getGetMyTasksMockHandler((info): Task[] => {
    const url = new URL(info.request.url)
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')
    if (!start || !end) return tasks
    return tasks.filter((t) => intersects(t.start, t.end, start, end))
  }),

  getCreateTaskMockHandler(async (info): Promise<number> => {
    const body = (await info.request.json()) as CreateTaskRequest
    const id = nextId++
    const stamp = nowStamp()
    tasks.push({ id, profileId: 1, ...body, createdAt: stamp, modifiedAt: stamp })
    return id
  }),

  getUpdateTaskMockHandler(async (info): Promise<void> => {
    const id = Number(info.params.taskId)
    const body = (await info.request.json()) as UpdateTaskRequest
    const stamp = nowStamp()
    tasks = tasks.map((t) => (t.id === id ? { ...t, ...body, modifiedAt: stamp } : t))
  }),

  getDeleteTaskMockHandler((info): void => {
    const id = Number(info.params.taskId)
    tasks = tasks.filter((t) => t.id !== id)
  }),
]
