import type { ProjectInfo } from './types'
import type { ScheduleTask } from './schedule-grid'

export const MOCK_PROJECT: ProjectInfo = {
  id: '1',
  name: '모튼아파트 리모델링 01',
  address: '경기도 수원시 율전로 00번길 00-00, 000호',
}

export const MOCK_SCHEDULE_TASKS: ScheduleTask[] = [
  {
    id: '1',
    category: '철거',
    ganttName: '철거작업',
    startDate: '2026-04-28',
    endDate: '2026-04-30',
    status: 'completed',
    assignee: { name: '이송목', region: '경기도', level: '준기공', specialty: '도배' },
  },
  {
    id: '2',
    category: '전기',
    ganttName: '전기 시공',
    startDate: '2026-05-01',
    endDate: '2026-05-03',
    status: 'in_progress',
    assignee: { name: '손장수', region: '서울', level: '기공', specialty: '전기' },
  },
  {
    id: '3',
    category: '목공 · 창호',
    ganttName: '목재/창호 설치',
    startDate: '2026-05-03',
    endDate: '2026-05-04',
    status: 'in_progress',
    assignee: { name: '홍길동', region: '인천', level: '반장', specialty: '목재' },
  },
  {
    id: '4',
    category: '타일',
    ganttName: '타일',
    startDate: '2026-05-04',
    endDate: '2026-05-05',
    status: 'recruited',
    assignee: { name: '탁재훈', region: '경기도', level: '준기공', specialty: '타일' },
  },
  {
    id: '5',
    category: '필름',
    ganttName: '필름',
    startDate: '2026-05-06',
    endDate: '2026-05-07',
    status: 'recruited',
    assignee: { name: '송중기', region: '서울', level: '기공', specialty: '필름' },
  },
  {
    id: '6',
    category: '도배',
    ganttName: '도배',
    startDate: '2026-05-08',
    endDate: '2026-05-09',
    status: 'recruited',
    assignee: { name: '박세리', region: '인천', level: '반장', specialty: '페인트' },
  },
  {
    id: '7',
    category: '바닥',
    ganttName: '바닥 및 마무리',
    startDate: '2026-05-10',
    endDate: '2026-05-11',
    status: 'recruiting',
    assignee: { name: '최수종', region: '경기도', level: '준기공', specialty: '방수' },
  },
  {
    id: '8',
    category: '싱크대 · 가구',
    ganttName: '가구 설치',
    startDate: '2026-05-12',
    endDate: '2026-05-13',
    status: 'not_started',
  },
  {
    id: '9',
    category: '조명',
    ganttName: '조명 설치',
    startDate: '2026-05-12',
    endDate: '2026-05-14',
    status: 'not_started',
  },
]

export const MOCK_DATE_RANGE = {
  startDate: '2026-04-28',
  endDate: '2026-05-16',
  today: '2026-05-04',
}
