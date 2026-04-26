import { http } from 'msw'
import { ok, notFound } from '../lib/response'
import { posts, profiles } from '../data/seed'
import { paginate } from '../lib/pagination'

// Feed 는 Post 와 1:1 매핑된 view 모델 (작성자 정보가 join 되어 있음).
// 기존 mock-server 엔 없던 신규 엔드포인트 — posts 데이터 기반으로 즉석 조립.
const buildFeedItem = (post: (typeof posts)[number]) => {
  const profile = profiles.find((p) => p.id === post.authorId)
  return {
    id: post.id,
    post,
    author: profile
      ? {
          id: profile.id,
          name: profile.about.split('입니다')[0]!.trim() || `User ${profile.id}`,
          headline: profile.headline,
          picture: `https://picsum.photos/seed/${profile.id}/100`,
          primaryTrade: profile.primaryTrade,
        }
      : null,
  }
}

export const feedsHandlers = [
  http.get('*/api/v1/feeds', ({ request }) => {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)
    const feeds = posts.map(buildFeedItem)
    return ok(paginate(feeds, cursor, limit))
  }),

  http.get('*/api/v1/feeds/:feedId', ({ params }) => {
    const id = parseInt(params.feedId as string, 10)
    const post = posts.find((p) => p.id === id)
    if (!post) return notFound('피드를 찾을 수 없습니다')
    return ok(buildFeedItem(post))
  }),
]
