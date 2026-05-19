import type { GanttTask } from '@/components/gantt-chart'

export const MOCK_TASKS: GanttTask[] = [
  {
    id: '1',
    name: '철거작업',
    category: '철거',
    startDate: '2026-04-28',
    endDate: '2026-04-30',
    status: 'completed',
  },
  {
    id: '2',
    name: '전기 시공',
    category: '전기',
    startDate: '2026-05-01',
    endDate: '2026-05-03',
    status: 'in_progress',
  },
  {
    id: '3',
    name: '목재/창호 설치',
    category: '목공 · 창호',
    startDate: '2026-05-03',
    endDate: '2026-05-04',
    status: 'in_progress',
  },
  {
    id: '4',
    name: '타일',
    category: '타일',
    startDate: '2026-05-04',
    endDate: '2026-05-05',
    status: 'recruited',
  },
  {
    id: '5',
    name: '필름',
    category: '필름',
    startDate: '2026-05-06',
    endDate: '2026-05-07',
    status: 'recruited',
  },
  {
    id: '6',
    name: '도배',
    category: '도배',
    startDate: '2026-05-08',
    endDate: '2026-05-09',
    status: 'recruited',
  },
  {
    id: '7',
    name: '바닥 및 마무리',
    category: '바닥',
    startDate: '2026-05-10',
    endDate: '2026-05-11',
    status: 'recruiting',
  },
  {
    id: '8',
    name: '가구 설치',
    category: '싱크대 · 가구',
    startDate: '2026-05-12',
    endDate: '2026-05-13',
    status: 'not_started',
  },
  {
    id: '9',
    name: '조명 설치',
    category: '조명',
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
