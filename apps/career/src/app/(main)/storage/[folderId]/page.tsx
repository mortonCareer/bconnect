/**
 * @figma-scaffold 동산보드 폴더 — career, 와이어프레임만 (SPRINT4 pre-build, 기획 node-id=1095-426/1105-483)
 */
import { Suspense } from 'react'
import { CareerFolderView } from './_adapters/CareerFolderView'

export default async function CareerStorageFolderPage({
  params,
}: {
  params: Promise<{ folderId: string }>
}) {
  const { folderId } = await params
  return (
    <Suspense>
      <CareerFolderView folderId={folderId} />
    </Suspense>
  )
}
