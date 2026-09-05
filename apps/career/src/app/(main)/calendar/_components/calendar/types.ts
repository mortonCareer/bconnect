import type { Address, TaskProgress, TaskStatus, Trade } from '@bconnect/api-client'

interface CalendarTaskBase {
  id: number
  /** 바·상세 제목. */
  title: string
  start: string
  end: string
  /** 색 팔레트 인덱스 (id 기반 안정적). */
  colorIndex: number
  /** 진행 상태 — 수정 저장 시 현재값 되돌리기용. 화면 표시·변경은 없다(#1160). */
  progress: TaskProgress
  company?: string
  address?: Address
  trades: Trade[]
  /** 업체가 남긴 요청사항 — 업체 작업에만 있다. */
  requirement: string
  memo: string
}

/**
 * API 작업 → 캘린더 뷰모델. canManage 로 갈리는 판별 union (#1176).
 * - WorkerTask: 본인 작업이라 수정·삭제 가능하고 섭외 상태가 없다.
 * - AssigneeTask: 업체 제안 작업이라 읽기 전용이고 섭외 상태를 가진다(#1156).
 */
export type CalendarTask = CalendarTaskBase &
  ({ canManage: true; status?: never } | { canManage: false; status: TaskStatus })

/** 한 작업이 한 주(週)행 안에서 차지하는 바 조각. */
export interface BarSegment {
  task: CalendarTask
  /** 0..6 시작 열. */
  colStart: number
  /** 1..7 차지 열 수. */
  colSpan: number
  /** 세로 레인 (0부터). */
  lane: number
  /** 주 시작에서 잘렸는지(왼쪽 둥근 모서리 억제). */
  continuesLeft: boolean
  continuesRight: boolean
}

export interface WeekRowModel {
  /** 7개 ISO 날짜. */
  cells: string[]
  segments: BarSegment[]
  /** 열별 숨겨진(레인 초과) 작업 수 — "+N" 표시용. */
  overflowByDay: number[]
}
