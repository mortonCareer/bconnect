/**
 * @figma-scaffold 공유 저장소(동산보드) 루트 — 와이어프레임만, 세부 시안 미정 (SPRINT4 pre-build, 기획 node-id=1940-6291)
 */
import { StorageRoot } from './_components/StorageRoot'

export default async function StoragePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  return <StorageRoot projectId={projectId} />
}
