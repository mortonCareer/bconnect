import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// 저장소 루트·폴더 공통. page.tsx 에 두면 하위 라우트가 상속하지 못해 layout 으로 올린다 (#785).
// plan 의 projects/[projectId]/storage 와 같은 용어("저장소")를 쓴다.
export const metadata: Metadata = { title: '저장소' }

export default function StorageLayout({ children }: { children: ReactNode }) {
  return children
}
