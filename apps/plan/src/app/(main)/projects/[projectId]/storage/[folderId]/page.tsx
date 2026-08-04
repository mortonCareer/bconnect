/**
 * @figma-scaffold 공유 저장소(동산보드) 폴더 — 와이어프레임만, 세부 시안 미정 (SPRINT4 pre-build, 기획 node-id=2042-2727/2042-2853)
 */
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { StorageFolder } from '../_components/StorageFolder'

export const metadata: Metadata = { title: '저장소' }

export default async function StorageFolderPage({
  params,
}: {
  params: Promise<{ projectId: string; folderId: string }>
}) {
  const { projectId, folderId } = await params
  return (
    <Suspense>
      <StorageFolder projectId={projectId} folderId={folderId} />
    </Suspense>
  )
}
