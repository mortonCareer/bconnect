import type { Trade } from '@bconnect/api-client'

export type TaskStatus = 'completed' | 'in_progress' | 'recruited' | 'recruiting' | 'not_started'

export type TaskAssignee = {
  profileId: number
  name: string
  region: string
  level: string
  specialty: string
}

export type ScheduleTask = {
  id: string
  /** 공종 — api-client Trade enum. 그리드 공종 컬럼 표시는 TRADE_LABELS join 파생 (별도 필드 X) */
  trades: Trade[]
  ganttName: string
  startDate: string
  endDate: string
  status: TaskStatus
  assignee?: TaskAssignee
  /** 이하 작업 생성/편집 패널(#582) 필드 — mock 단계, BE 도메인 확정 시 정합 */
  corpName?: string
  address?: string
  addressDetail?: string
  request?: string
  memo?: string
}

export type ScheduleGridProps = {
  today?: string
}
