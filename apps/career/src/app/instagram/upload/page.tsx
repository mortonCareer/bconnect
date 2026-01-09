'use client'

import { useState, useCallback } from 'react'

interface ParsedPost {
  id: string
  uri: string
  caption: string
  timestamp: number
  type: 'image' | 'video'
  hasMediaFile: boolean
}

interface ApiResponse {
  success: boolean
  count?: number
  posts?: ParsedPost[]
  error?: string
}

export default function InstagramUploadPage() {
  const [posts, setPosts] = useState<ParsedPost[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // ZIP 파일 검증
    if (!file.name.endsWith('.zip')) {
      setError('ZIP 파일만 업로드 가능합니다.')
      return
    }

    // 파일 크기 제한 (50MB)
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setError('파일 크기는 50MB 이하여야 합니다.')
      return
    }

    setLoading(true)
    setError('')
    setPosts([])
    setSelected(new Set())

    try {
      // FormData로 파일 전송
      const formData = new FormData()
      formData.append('file', file)

      // Next.js API Route 호출
      const response = await fetch('/api/instagram/parse', {
        method: 'POST',
        body: formData,
      })

      const data: ApiResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || '파싱 실패')
      }

      if (!data.posts || data.posts.length === 0) {
        setError('게시물을 찾을 수 없습니다. Instagram 데이터 다운로드 ZIP 파일인지 확인해주세요.')
      } else {
        setPosts(data.posts)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'ZIP 파일 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

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

  const selectAll = () => {
    if (selected.size === posts.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(posts.map((p) => p.id)))
    }
  }

  const handleConfirm = () => {
    const selectedPosts = posts.filter((p) => selected.has(p.id))
    console.log('선택된 게시물:', selectedPosts)
    alert(`선택된 게시물 ${selectedPosts.length}개\n\n콘솔에서 데이터를 확인하세요.`)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold">Instagram 데이터 업로드</h1>
        <p className="mb-6 text-gray-600">
          Instagram에서 다운로드한 <strong>ZIP 파일</strong>을 그대로 업로드하세요.
          <br />
          <span className="text-sm text-gray-400">
            (설정 → 계정 센터 → 내 정보 및 권한 → 정보 다운로드 → JSON 형식)
          </span>
        </p>

        {/* 파일 업로드 영역 */}
        <label className="mb-8 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-pink-400 hover:bg-pink-50">
          <input
            type="file"
            accept=".zip"
            onChange={handleFileUpload}
            className="hidden"
            disabled={loading}
          />
          <svg
            className="mb-2 h-10 w-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span className="text-gray-600">클릭하여 Instagram ZIP 파일 선택</span>
          <span className="mt-1 text-xs text-gray-400">instagram-*.zip</span>
        </label>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-pink-500" />
            <p className="mt-4 text-gray-500">ZIP 파일 분석 중...</p>
          </div>
        )}

        {error && <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600">{error}</div>}

        {posts.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  {posts.length}개 게시물 발견 / {selected.size}개 선택됨
                </span>
                <button onClick={selectAll} className="text-sm text-pink-500 hover:text-pink-600">
                  {selected.size === posts.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              <button
                onClick={handleConfirm}
                disabled={selected.size === 0}
                className="rounded-lg bg-pink-500 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                선택 완료
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => toggleSelect(post.id)}
                  className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                    selected.has(post.id)
                      ? 'border-pink-500 ring-2 ring-pink-500'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <div className="flex aspect-square w-full items-center justify-center bg-gray-200">
                    <div className="p-2 text-center">
                      <div className="mb-1 text-3xl">{post.type === 'video' ? '🎬' : '🖼️'}</div>
                      <p className="max-w-full truncate text-xs text-gray-500">
                        {post.uri.split('/').pop()}
                      </p>
                    </div>
                  </div>

                  {post.type === 'video' && (
                    <div className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                      동영상
                    </div>
                  )}

                  {selected.has(post.id) && (
                    <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white">
                      ✓
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs text-white">{formatDate(post.timestamp)}</p>
                    {post.caption && (
                      <p className="line-clamp-1 text-xs text-white/80">{post.caption}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 선택된 게시물 데이터 미리보기 */}
            {selected.size > 0 && (
              <div className="mt-8 rounded-lg bg-gray-100 p-4">
                <h2 className="mb-2 font-semibold">선택된 데이터 미리보기</h2>
                <pre className="max-h-60 overflow-auto rounded bg-gray-800 p-4 text-xs text-green-400">
                  {JSON.stringify(
                    posts.filter((p) => selected.has(p.id)),
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
