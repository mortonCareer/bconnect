import { TRADE_LABELS, type Trade } from '@bconnect/api-client'
import type { ScheduleTask, TaskAssignee, TaskStatus } from './types'

/** 공종 배열 → 그리드 공종 컬럼/패널 타이틀 표시 라벨 ('타일 · 도배'). category 필드 대체 파생. */
export function tradesLabel(trades: Trade[]): string {
  return trades.map((t) => TRADE_LABELS[t] ?? t).join(' · ')
}

/** 대표 기술자 — 어댑터(task-adapter)가 workerId 프로필 또는 ACTIVE offer 에서 파생. 없으면 미배정. */
export function taskAssignee(task: ScheduleTask): TaskAssignee | undefined {
  return task.assignee
}

export const COL_CATEGORY = 120
export const COL_STATUS = 100
export const COL_ASSIGNEE = 220

export const DAY_WIDTH = 44
export const RIGHT_PAD_WIDTH = 88
export const ROW_HEIGHT = 52
export const HEADER_HEIGHT = 40
export const BAR_HEIGHT = 36
export const BAR_TOP = 7.5

// 초기 스크롤: 오늘 기준 과거를 며칠 보여줄지 (과거 약간 + 미래 위주)
export const PAST_CONTEXT_DAYS = 3

// 좌측 고정 컬럼의 sticky left 오프셋 (공종 / 상태 / 기술자)
export const STICKY_LEFT = [0, COL_CATEGORY, COL_CATEGORY + COL_STATUS]

export const BAR_STYLES: Record<TaskStatus, { bg: string; text: string }> = {
  completed: { bg: '#b0b0b0', text: '#5a5a5a' },
  in_progress: { bg: '#284dbc', text: '#ffffff' },
  recruited: { bg: '#569365', text: '#ffffff' },
  recruiting: { bg: '#ffbf70', text: '#2d2d2d' },
  not_started: { bg: '#d0d0d0', text: '#2d2d2d' },
}

export const PILL_STYLES: Record<TaskStatus, string> = {
  completed: 'bg-[#f0f0f0] border border-[#d0d0d0] text-[#3d3d3d]',
  in_progress: 'bg-primary text-white',
  recruited: 'bg-primary-50 border border-[#c0d0ff] text-primary',
  recruiting: 'bg-[#fff3e0] border border-[#ffe0b2] text-[#e6780a]',
  not_started: 'bg-white border border-[#d0d0d0] text-[#a5a5a5]',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  completed: '완료됨',
  in_progress: '진행 중',
  recruited: '섭외됨',
  recruiting: '섭외 중',
  not_started: '시작 전',
}
