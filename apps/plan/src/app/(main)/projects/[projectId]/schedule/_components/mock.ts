import { Trade } from '@bconnect/api-client'
import type { ScheduleTask } from './schedule-grid'

type ProjectInfo = {
  id: string
  name: string
  address: string
}

export const MOCK_PROJECT: ProjectInfo = {
  id: '1',
  name: '모튼아파트 리모델링 01 (Mocked)',
  address: '경기도 수원시 율전로 00번길 00-00, 000호 (Mocked)',
}

export const MOCK_SCHEDULE_TASKS: ScheduleTask[] = [
  {
    id: '1',
    trades: [Trade.DEMOLITION],
    ganttName: '철거작업',
    startDate: '2026-04-28',
    endDate: '2026-04-30',
    status: 'completed',
    assignee: {
      profileId: 1,
      name: '이송목 (Mocked)',
      region: '경기도',
      level: '준기공',
      specialty: '도배',
    },
  },
  {
    id: '2',
    trades: [Trade.ELECTRICAL],
    ganttName: '전기 시공',
    startDate: '2026-05-01',
    endDate: '2026-05-03',
    status: 'in_progress',
    assignee: {
      profileId: 2,
      name: '손장수 (Mocked)',
      region: '서울',
      level: '기공',
      specialty: '전기',
    },
  },
  {
    id: '3',
    trades: [Trade.CARPENTRY, Trade.GLAZING],
    ganttName: '목재/창호 설치',
    startDate: '2026-05-03',
    endDate: '2026-05-04',
    status: 'in_progress',
    assignee: {
      profileId: 3,
      name: '홍길동 (Mocked)',
      region: '인천',
      level: '반장',
      specialty: '목재',
    },
  },
  {
    id: '4',
    trades: [Trade.TILING, Trade.WALLPAPER],
    ganttName: '타일',
    corpName: '서정 건축',
    address: '경기도 수원시 율전로 00번길 00-00',
    addressDetail: '000호',
    request: '타일 시공 및 단일 벽면 일부 도배',
    memo: '세밀한 작업이 필요함',
    startDate: '2026-05-04',
    endDate: '2026-05-05',
    status: 'recruited',
    assignee: {
      profileId: 4,
      name: '탁재훈 (Mocked)',
      region: '경기도',
      level: '준기공',
      specialty: '타일',
    },
  },
  {
    id: '5',
    trades: [Trade.FILM_SHEET],
    ganttName: '필름',
    startDate: '2026-05-06',
    endDate: '2026-05-07',
    status: 'recruited',
    assignee: {
      profileId: 5,
      name: '송중기 (Mocked)',
      region: '서울',
      level: '기공',
      specialty: '필름',
    },
  },
  {
    id: '6',
    trades: [Trade.WALLPAPER],
    ganttName: '도배',
    startDate: '2026-05-08',
    endDate: '2026-05-09',
    status: 'recruited',
    assignee: {
      profileId: 6,
      name: '박세리 (Mocked)',
      region: '인천',
      level: '반장',
      specialty: '페인트',
    },
  },
  {
    id: '7',
    trades: [Trade.HARDWOOD],
    ganttName: '바닥 및 마무리',
    startDate: '2026-05-10',
    endDate: '2026-05-11',
    status: 'recruiting',
    assignee: {
      profileId: 7,
      name: '최수종 (Mocked)',
      region: '경기도',
      level: '준기공',
      specialty: '방수',
    },
  },
  {
    id: '8',
    trades: [Trade.SINK, Trade.FURNITURE],
    ganttName: '가구 설치',
    startDate: '2026-05-12',
    endDate: '2026-05-13',
    status: 'not_started',
  },
  {
    id: '9',
    trades: [Trade.ELECTRICAL],
    ganttName: '조명 설치',
    startDate: '2026-05-12',
    endDate: '2026-05-14',
    status: 'not_started',
  },
]

export const MOCK_TODAY = '2026-05-04'
