import { postImageUrls } from '@bconnect/api-client'
import type { Feed } from '@bconnect/api-client'
import { durationDays } from '@bconnect/config/date'
import { formatDays } from '@bconnect/config/format'

/** 작업물 카드가 쓰는 표시값. 작업(task)에 연결되지 않은 글은 업체명·소요일이 모두 없다. */
export interface FeedWork {
  images: string[]
  company?: string
  /** 소요 일수 — 숫자로 쓰는 호출부(plan 기술자 카드 썸네일)용 */
  days?: number
  /** '4일 소요' — 문자열로 쓰는 호출부(작업물 카드 메타행)용 */
  duration?: string
}

/**
 * Feed 의 post·task 를 작업물 카드 표시값으로 편다.
 * 같은 매핑이 홈 피드·프로필 작업물 탭·기술자 카드 셋에서 필요해 여기 모았다.
 */
export function feedWork(feed: Pick<Feed, 'post' | 'task'>): FeedWork {
  const { post, task } = feed
  const days = task ? durationDays(task.start, task.end) : undefined
  return {
    images: post ? postImageUrls(post) : [],
    company: task?.workerCompany ?? undefined,
    days,
    duration: days == null ? undefined : formatDays(days),
  }
}
