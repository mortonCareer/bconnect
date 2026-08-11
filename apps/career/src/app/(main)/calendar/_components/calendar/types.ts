import type { Address, Task, TaskProgress, TaskStatus, Trade } from '@bconnect/api-client'

/** API Task → 캘린더 뷰모델. */
export interface CalendarTask {
  id: number
  /** 바·상세 제목. workerTitle/projectTitle 중 현재 계약에서 노출된 제목. */
  title: string
  start: string
  end: string
  /** 색 팔레트 인덱스 (id 기반 안정적). */
  colorIndex: number
  /** 섭외 상태 — 업체 작업 상세 헤더 칩. 개인 작업에는 의미가 없다(#1156). */
  status: TaskStatus
  /** 진행 상태 — 수정 저장 시 현재값 되돌리기용. 화면 표시·변경은 없다(#1160). */
  progress: TaskProgress
  /** career worker 화면에서 직접 수정/삭제 가능한 개인 작업 여부. */
  canManage: boolean
  company?: string
  address?: Address
  trades: Trade[]
  /** 업체가 남긴 요청사항 — 업체 작업에만 있다. */
  requirement: string
  memo: string
  raw: Task
}

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
