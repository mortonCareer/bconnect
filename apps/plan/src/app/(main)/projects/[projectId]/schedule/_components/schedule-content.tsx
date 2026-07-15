'use client'

import { ApiError, useGetProject } from '@bconnect/api-client'
import { Button } from '@bconnect/ui'
import Link from 'next/link'
import { ScheduleFooter } from './schedule-footer'
import { ScheduleGrid } from './schedule-grid'
import { ScheduleHeader } from './schedule-header'

// BE 공통 not-found 코드. 프로젝트 조회도 이 코드로 404를 반환한다.
const PROJECT_NOT_FOUND_CODE = 'C005'

/**
 * 프로젝트 조회가 BE 공통 404(C005)일 때만 안내 화면으로 전환한다.
 * 작업 목록 404는 #840에서 따로 다루므로 여기서 게이트하지 않는다.
 */
export function ScheduleContent({ projectId }: { projectId: string }) {
  const { error } = useGetProject(Number(projectId))

  const isNotFound = error instanceof ApiError && error.code === PROJECT_NOT_FOUND_CODE
  if (isNotFound) return <ProjectNotFound />

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col">
        <ScheduleHeader projectId={projectId} />
        <ScheduleGrid projectId={projectId} />
      </div>
      <div className="flex-1" />
      <ScheduleFooter />
    </div>
  )
}

function ProjectNotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex flex-col gap-1.5">
        <p className="text-lg font-semibold text-gray-900">프로젝트를 찾을 수 없어요</p>
        <p className="text-r-14 text-gray-500">
          주소가 잘못되었거나 접근 권한이 없는 프로젝트예요.
        </p>
      </div>
      <Button asChild variant="outline" size="small">
        <Link href="/">기술자 탐색으로</Link>
      </Button>
    </div>
  )
}
