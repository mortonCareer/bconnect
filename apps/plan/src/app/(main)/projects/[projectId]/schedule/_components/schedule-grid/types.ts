import type { Trade } from '@bconnect/api-client'

export type TaskStatus = 'completed' | 'in_progress' | 'recruited' | 'recruiting' | 'not_started'

export type TaskAssignee = {
  profileId: number
  name: string
  region: string
  level: string
  specialty: string
}

/** 대기중(큐만, 정렬·삭제) | 섭외중(발송됨, 취소만·정렬잠금). 미래 BE enum 매핑. */
export type OfferStatus = 'waiting' | 'offered'

/** 섭외 대기열 항목 — TaskAssignee 동형 + status/picture. 미래 API 리소스(Offer)와 1:1. */
export type OfferQueueItem = TaskAssignee & {
  status: OfferStatus
  picture?: string
}

export type ScheduleTask = {
  id: string
  /** 소속 프로젝트 (멀티 프로젝트 스코핑). mock 단계, BE Project 도메인 확정 시 정합 */
  projectId: string
  /** 공종 — api-client Trade enum. 그리드 공종 컬럼 표시는 TRADE_LABELS join 파생 (별도 필드 X) */
  trades: Trade[]
  ganttName: string
  startDate: string
  endDate: string
  status: TaskStatus
  /** 드래그-생성 직후 미확정 상태 (#575). true 면 간트바 흐리게 + 패널 닫기 가드. 폼 유효 시 해제. */
  draft?: boolean
  /** 섭외 대기열 (#575) — SSOT. 대표 기술자(assignee)는 'offered' 멤버에서 파생(taskAssignee) */
  offerQueue?: OfferQueueItem[]
  /** 이하 작업 생성/편집 패널(#582) 필드 — mock 단계, BE 도메인 확정 시 정합 */
  corpName?: string
  address?: string
  addressDetail?: string
  request?: string
  memo?: string
  /** 대표 기술자 — 섭외 확정(workerId) 또는 ACTIVE offer 멤버에서 어댑터가 파생 */
  assignee?: TaskAssignee
}

export type ScheduleGridProps = {
  projectId: string
  today?: string
}
