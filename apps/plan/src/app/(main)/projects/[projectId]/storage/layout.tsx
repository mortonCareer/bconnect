import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// 저장소 루트·폴더 공통 정적 fallback. 프로젝트명은 로그인 후 조회라 서버에서 알 수 없어
// 각 화면이 useDocumentTitle 로 "{프로젝트명} - 저장소" 를 덮어쓴다 (#785).
export const metadata: Metadata = { title: '저장소' }

export default function StorageLayout({ children }: { children: ReactNode }) {
  return children
}
