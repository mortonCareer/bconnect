'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface InstagramMedia {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string
  thumbnail_url?: string
  permalink: string
  timestamp: string
}

interface MediaResponse {
  data: InstagramMedia[]
  paging?: {
    cursors: { after: string; before: string }
    next?: string
  }
}

const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com'

export default function InstagramPostsPage() {
  const router = useRouter()
  const [media, setMedia] = useState<InstagramMedia[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const token = sessionStorage.getItem('instagram_access_token')

    if (!token) {
      router.push('/instagram')
      return
    }

    fetchMedia(token)
  }, [router])

  const fetchMedia = async (accessToken: string) => {
    try {
      const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'
      const response = await fetch(
        `${INSTAGRAM_GRAPH_URL}/me/media?fields=${fields}&access_token=${accessToken}`
      )

      const data: MediaResponse = await response.json()

      if (!response.ok) {
        throw new Error(
          (data as unknown as { error: { message: string } }).error?.message || '미디어 조회 실패'
        )
      }

      setMedia(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleConfirm = () => {
    const selectedMedia = media.filter((m) => selected.has(m.id))
    console.log('선택된 게시물:', selectedMedia)
    alert(`선택된 게시물 ${selectedMedia.length}개\n\n콘솔에서 데이터를 확인하세요.`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-pink-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-xl font-bold text-red-500">오류 발생</h1>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => router.push('/instagram')}
          className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          다시 로그인
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Instagram 게시물 선택</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{selected.size}개 선택됨</span>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="rounded-lg bg-pink-500 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              선택 완료
            </button>
          </div>
        </div>

        {media.length === 0 ? (
          <p className="text-center text-gray-500">게시물이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {media.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                  selected.has(item.id)
                    ? 'border-pink-500 ring-2 ring-pink-500'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={item.thumbnail_url || item.media_url}
                  alt={item.caption || '게시물'}
                  className="aspect-square w-full object-cover"
                />

                {item.media_type === 'VIDEO' && (
                  <div className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                    동영상
                  </div>
                )}

                {item.media_type === 'CAROUSEL_ALBUM' && (
                  <div className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                    여러 장
                  </div>
                )}

                {selected.has(item.id) && (
                  <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white">
                    ✓
                  </div>
                )}

                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="line-clamp-2 text-xs text-white">{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 선택된 게시물 데이터 미리보기 */}
        {selected.size > 0 && (
          <div className="mt-8 rounded-lg bg-gray-100 p-4">
            <h2 className="mb-2 font-semibold">선택된 데이터 미리보기</h2>
            <pre className="max-h-60 overflow-auto rounded bg-gray-800 p-4 text-xs text-green-400">
              {JSON.stringify(
                media.filter((m) => selected.has(m.id)),
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
