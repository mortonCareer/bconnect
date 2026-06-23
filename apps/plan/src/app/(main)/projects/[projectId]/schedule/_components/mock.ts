import { Trade } from '@bconnect/api-client'
import type { ScheduleTask } from './schedule-grid'

export type ProjectInfo = {
  id: string
  name: string
  address: string
}

// TODO(신규 BE 이슈 필요 — Project 도메인): 내 프로젝트 목록 조회 API 로 교체.
export const MOCK_PROJECTS: ProjectInfo[] = [
  {
    id: '1',
    name: '모튼아파트 리모델링 01 (Mocked)',
    address: '경기도 수원시 율전로 00번길 00-00, 000호 (Mocked)',
  },
  {
    id: '2',
    name: '래미안 리모델링 02 (Mocked)',
    address: '서울 강남구 테헤란로 00길 00, 0000호 (Mocked)',
  },
  {
    id: '3',
    name: '자담 사옥 인테리어 (Mocked)',
    address: '인천 연수구 송도과학로 00, 000호 (Mocked)',
  },
]

/** 기본 프로젝트(첫번째) — projectId 미지정 컨텍스트의 폴백. */
export const MOCK_PROJECT = MOCK_PROJECTS[0]

export const getMockProject = (projectId: string): ProjectInfo | undefined =>
  MOCK_PROJECTS.find((p) => p.id === projectId)

export const MOCK_TODAY = '2026-05-04'

export const MOCK_SCHEDULE_TASKS: ScheduleTask[] = [
  {
    id: '1',
    projectId: '1',
    trades: [Trade.DEMOLITION],
    ganttName: '철거작업',
    startDate: '2026-04-28',
    endDate: '2026-04-30',
    status: 'completed',
    offerQueue: [
      {
        profileId: 1,
        name: '이송목 (Mocked)',
        region: '경기도',
        level: '준기공',
        specialty: '도배',
        status: 'offered',
      },
    ],
  },
  {
    id: '2',
    projectId: '1',
    trades: [Trade.ELECTRICAL],
    ganttName: '전기 시공',
    startDate: '2026-05-01',
    endDate: '2026-05-03',
    status: 'in_progress',
    offerQueue: [
      {
        profileId: 2,
        name: '손장수 (Mocked)',
        region: '서울',
        level: '기공',
        specialty: '전기',
        status: 'offered',
      },
    ],
  },
  {
    id: '3',
    projectId: '1',
    trades: [Trade.CARPENTRY, Trade.GLAZING],
    ganttName: '목재/창호 설치',
    startDate: '2026-05-03',
    endDate: '2026-05-04',
    status: 'in_progress',
    offerQueue: [
      {
        profileId: 3,
        name: '홍길동 (Mocked)',
        region: '인천',
        level: '반장',
        specialty: '목재',
        status: 'offered',
      },
    ],
  },
  {
    id: '4',
    projectId: '1',
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
    offerQueue: [
      {
        profileId: 4,
        name: '탁재훈 (Mocked)',
        region: '경기도',
        level: '준기공',
        specialty: '타일',
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
    ],
  },
  {
    id: '5',
    projectId: '1',
    trades: [Trade.FILM_SHEET],
    ganttName: '필름',
    startDate: '2026-05-06',
    endDate: '2026-05-07',
    status: 'recruited',
    offerQueue: [
      {
        profileId: 5,
        name: '송중기 (Mocked)',
        region: '서울',
        level: '기공',
        specialty: '필름',
        status: 'offered',
      },
    ],
  },
  {
    id: '6',
    projectId: '1',
    trades: [Trade.WALLPAPER],
    ganttName: '도배',
    startDate: '2026-05-08',
    endDate: '2026-05-09',
    status: 'recruited',
    offerQueue: [
      {
        profileId: 6,
        name: '박세리 (Mocked)',
        region: '인천',
        level: '반장',
        specialty: '페인트',
        status: 'offered',
      },
    ],
  },
  {
    id: '7',
    projectId: '1',
    trades: [Trade.HARDWOOD],
    ganttName: '바닥 및 마무리',
    startDate: '2026-05-10',
    endDate: '2026-05-11',
    status: 'recruiting',
    offerQueue: [
      {
        profileId: 7,
        name: '최수종 (Mocked)',
        region: '경기도',
        level: '준기공',
        specialty: '방수',
        status: 'offered',
      },
    ],
  },
  {
    id: '8',
    projectId: '1',
    trades: [Trade.SINK, Trade.FURNITURE],
    ganttName: '가구 설치',
    startDate: '2026-05-12',
    endDate: '2026-05-13',
    status: 'not_started',
  },
  {
    id: '9',
    projectId: '1',
    trades: [Trade.ELECTRICAL],
    ganttName: '조명 설치',
    startDate: '2026-05-12',
    endDate: '2026-05-14',
    status: 'not_started',
  },
  {
    id: '10',
    projectId: '2',
    trades: [Trade.DEMOLITION],
    ganttName: '철거',
    startDate: '2026-05-02',
    endDate: '2026-05-04',
    status: 'in_progress',
    offerQueue: [
      {
        profileId: 21,
        name: '김철수 (Mocked)',
        region: '서울',
        level: '기공',
        specialty: '철거',
        status: 'offered',
      },
    ],
  },
  {
    id: '11',
    projectId: '2',
    trades: [Trade.TILING],
    ganttName: '타일 시공',
    startDate: '2026-05-05',
    endDate: '2026-05-08',
    status: 'recruiting',
    offerQueue: [
      {
        profileId: 22,
        name: '이영희 (Mocked)',
        region: '경기도',
        level: '준기공',
        specialty: '타일',
        status: 'offered',
      },
    ],
  },
  {
    id: '12',
    projectId: '3',
    trades: [Trade.ELECTRICAL],
    ganttName: '전기 배선',
    startDate: '2026-05-06',
    endDate: '2026-05-09',
    status: 'not_started',
  },
  {
    id: '13',
    projectId: '3',
    trades: [Trade.WALLPAPER],
    ganttName: '도배',
    startDate: '2026-05-10',
    endDate: '2026-05-12',
    status: 'recruited',
    offerQueue: [
      {
        profileId: 23,
        name: '박민수 (Mocked)',
        region: '인천',
        level: '반장',
        specialty: '도배',
        status: 'offered',
      },
    ],
  },
]
