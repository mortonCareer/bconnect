/**
 * @figma-scaffold 동산보드(공유 저장소) 탐색기 루트 — career, 와이어프레임만 (SPRINT4 pre-build, 기획 node-id=1095-406)
 */
import type { Metadata } from 'next'

import { CareerStorageExplorer } from './_adapters/CareerStorageExplorer'

export const metadata: Metadata = { title: '자료함' }

export default function StoragePage() {
  return <CareerStorageExplorer />
}
