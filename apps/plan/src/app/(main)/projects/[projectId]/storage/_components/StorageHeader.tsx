'use client'

import Link from 'next/link'
import { Progress } from '@bconnect/ui'
import { useGetProject } from '@bconnect/api-client'
import { useFolder, useStorageUsage } from '@/lib/storage-mock/hooks'

const toMB = (bytes: number) => `${Math.round(bytes / 1_000_000)}MB`
const toGB = (bytes: number) => `${Math.round(bytes / 1_073_741_824)}GB`

/** 동산보드 헤더 — 프로젝트명 + breadcrumb(프로젝트 › 폴더) + TIP + 용량바. */
export function StorageHeader({ projectId, folderId }: { projectId: string; folderId?: string }) {
  const { data: project } = useGetProject(Number(projectId))
  const { data: folder } = useFolder(folderId ?? '')
  const { data: usage } = useStorageUsage(projectId)

  const projectName = project?.title ?? '프로젝트'
  const pct =
    usage && usage.totalBytes ? Math.min(100, (usage.usedBytes / usage.totalBytes) * 100) : 0

  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-gray-900">
          <Link href={`/projects/${projectId}/storage`} className="hover:underline">
            {projectName}
          </Link>
          {folder ? <span className="font-normal text-gray-400"> › {folder.title}</span> : null}
        </h1>
        <p className="mt-1 text-xs text-gray-500">TIP. 폴더를 현장/공종별로 관리해보세요</p>
      </div>
      {usage && (
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <Progress value={pct} className="w-28" />
          <span className="text-xs text-gray-400">
            {toMB(usage.usedBytes)}/{toGB(usage.totalBytes)}
          </span>
        </div>
      )}
    </div>
  )
}
