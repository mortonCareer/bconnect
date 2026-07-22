import { daysBetween } from '../date'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()

  if (diff < MINUTE) return '방금'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}분 전`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`
  if (diff < WEEK) return `${Math.floor(diff / DAY)}일 전`
  if (diff < MONTH) return `${Math.floor(diff / WEEK)}주 전`
  return `${Math.floor(diff / MONTH)}개월 전`
}

export function formatDuration(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / DAY)
  return `${days}일 소요`
}

/** "12.25 - 12.26 (총 2일 소요)" — 작업기간 표시(시작·종료일 포함). */
export function formatPeriod(start: string, end: string): string {
  const md = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`
  const days = daysBetween(start, end) + 1
  return `${md(start)} - ${md(end)} (총 ${days}일 소요)`
}

export function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const period = hours < 12 ? '오전' : '오후'
  const displayHours = hours % 12 || 12
  return `${period} ${displayHours}:${minutes}`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}
