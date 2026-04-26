// Cursor 기반 페이지네이션 헬퍼.
// FE 와 BE 모두 같은 모양의 응답을 기대 — { items, meta: { nextCursor, hasMore } }.

export interface PaginatedResponse<T> {
  items: T[]
  meta: { nextCursor: string | null; hasMore: boolean }
}

interface HasId {
  id: number
}

// Forward 페이지네이션 (목록, feed 등 — 첫 페이지가 가장 최신)
export function paginate<T extends HasId>(
  items: T[],
  cursor: string | null,
  limit = 20
): PaginatedResponse<T> {
  let startIdx = 0
  if (cursor) {
    const cursorId = parseInt(cursor, 10)
    const found = items.findIndex((item) => item.id === cursorId)
    if (found !== -1) startIdx = found
  }
  const page = items.slice(startIdx, startIdx + limit)
  const hasMore = startIdx + limit < items.length
  const nextCursor = hasMore ? String(items[startIdx + limit]!.id) : null
  return { items: page, meta: { nextCursor, hasMore } }
}

// Reverse 페이지네이션 (메시지 — cursor 보다 과거 메시지를 limit 개 가져옴)
export function paginateReverse<T extends HasId>(
  items: T[],
  before: string | null,
  limit = 30
): PaginatedResponse<T> {
  let endIdx = items.length
  if (before) {
    const beforeId = parseInt(before, 10)
    const found = items.findIndex((item) => item.id === beforeId)
    if (found !== -1) endIdx = found
  }
  const startIdx = Math.max(0, endIdx - limit)
  const page = items.slice(startIdx, endIdx)
  const hasMore = startIdx > 0
  const nextCursor = hasMore ? String(items[startIdx]!.id) : null
  return { items: page, meta: { nextCursor, hasMore } }
}
