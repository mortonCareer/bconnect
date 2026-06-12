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
  /** 그리드 공종 컬럼 표시 문자열 — trades 라벨 join (' · ') 파생 */
  category: string
  ganttName: string
  startDate: string
  endDate: string
  status: TaskStatus
  assignee?: TaskAssignee
  /** 이하 작업 생성/편집 패널(#582) 필드 — mock 단계, BE 도메인 확정 시 정합 */
  trades?: string[]
  corpName?: string
  address?: string
  addressDetail?: string
  request?: string
  memo?: string
}

export type ScheduleGridProps = {
  today?: string
}
