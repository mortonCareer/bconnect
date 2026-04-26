import { http } from 'msw'
import { ok, notFound } from '../lib/response'
import { posts, profiles } from '../data/seed'
import { paginate } from '../lib/pagination'

export const postsHandlers = [
  // 게시글 목록 (cursor pagination + 다양한 필터)
  http.get('*/api/v1/posts', ({ request }) => {
    const url = new URL(request.url)
    let filtered = [...posts]

    const authorId = url.searchParams.get('authorId')
    if (authorId) filtered = filtered.filter((p) => p.authorId === parseInt(authorId, 10))

    const taskId = url.searchParams.get('taskId')
    if (taskId) filtered = filtered.filter((p) => p.taskId === parseInt(taskId, 10))

    const trade = url.searchParams.get('trade')
    if (trade) {
      const matchingIds = profiles.filter((p) => p.primaryTrade === trade).map((p) => p.id)
      filtered = filtered.filter((p) => matchingIds.includes(p.authorId))
    }

    const minExp = url.searchParams.get('minExperience')
    if (minExp) {
      const ids = profiles.filter((p) => p.experience >= parseInt(minExp, 10)).map((p) => p.id)
      filtered = filtered.filter((p) => ids.includes(p.authorId))
    }

    const maxExp = url.searchParams.get('maxExperience')
    if (maxExp) {
      const ids = profiles.filter((p) => p.experience <= parseInt(maxExp, 10)).map((p) => p.id)
      filtered = filtered.filter((p) => ids.includes(p.authorId))
    }

    const cursor = url.searchParams.get('cursor')
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)
    return ok(paginate(filtered, cursor, limit))
  }),

  // 게시글 단건 조회
  http.get('*/api/v1/posts/:postId', ({ params }) => {
    const id = parseInt(params.postId as string, 10)
    const post = posts.find((p) => p.id === id)
    if (!post) return notFound('게시글을 찾을 수 없습니다')
    return ok(post)
  }),
]
