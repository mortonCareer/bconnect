import { postImageUrls } from '@bconnect/api-client'
import type { Feed } from '@bconnect/api-client'
import { durationDays } from '@bconnect/config/date'
import { formatDays } from '@bconnect/config/format'

/**
 * 작업물(Post + Task) 의 화면 표시값.
 * 작업(Task)에 연결되지 않은 게시글은 업체명·소요일이 모두 없다.
 */
export interface Work {
  images: string[]
  company?: string
  /** 소요 일수 — 숫자로 쓰는 호출부(plan 기술자 카드 썸네일)용 */
  days?: number
  /** '4일 소요' — 문자열로 쓰는 호출부(작업물 카드 메타행)용 */
  duration?: string
}

/**
 * 피드(Post + Task + Profile + Member) 에서 작업물 부분만 뽑아 표시값으로 편다.
 * 홈 피드·프로필 작업물 탭·기술자 카드 셋이 같은 매핑을 쓴다.
 */
export function toWork(feed: Pick<Feed, 'post' | 'task'>): Work {
  const { post, task } = feed
  const days = task ? durationDays(task.start, task.end) : undefined
  return {
    images: post ? postImageUrls(post) : [],
    company: task?.company ?? undefined,
    days,
    duration: days == null ? undefined : formatDays(days),
  }
}
