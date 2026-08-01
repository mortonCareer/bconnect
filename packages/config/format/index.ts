import { daysBetween, durationDays } from '../date'

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

/** task.start~end(YYYY-MM-DD, 양끝 포함) → '4일 소요'. 파싱 불가·역순이면 undefined. */
export function formatDurationDays(start: string, end: string): string | undefined {
  const days = durationDays(start, end)
  return days == null ? undefined : `${days}일 소요`
}

/** "12.25 - 12.26 (총 2일 소요)" — 작업기간 표시(시작·종료일 포함). */
export function formatPeriod(start: string, end: string): string {
  const md = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`
  const days = daysBetween(start, end) + 1
  return `${md(start)} - ${md(end)} (총 ${days}일 소요)`
}

const JONGSEONG_RIEUL = 8

/**
 * 받침 유무에 따라 조사를 골라 붙인다 — "이송목으로부터" / "서정건축로부터".
 * `withParticle('이송목', '으로부터', '로부터')`
 *
 * `으로/로` 계열은 ㄹ 받침이 받침 없는 쪽을 따르므로(서울로부터) `rieulFollowsWithout` 로 켠다.
 * 마지막 글자가 한글 음절이 아니면(영문·숫자) 받침 없는 형태로 둔다.
 */
export function withParticle(
  word: string,
  withJong: string,
  withoutJong: string,
  rieulFollowsWithout = false
): string {
  const code = word.trim().slice(-1).charCodeAt(0)
  if (!(code >= 0xac00 && code <= 0xd7a3)) return `${word}${withoutJong}`
  const jongseong = (code - 0xac00) % 28
  const useWithJong = jongseong !== 0 && !(rieulFollowsWithout && jongseong === JONGSEONG_RIEUL)
  return `${word}${useWithJong ? withJong : withoutJong}`
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
