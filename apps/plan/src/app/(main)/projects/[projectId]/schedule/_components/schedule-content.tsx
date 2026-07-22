'use client'

import { ApiError, useGetProject } from '@bconnect/api-client'
import { Button } from '@bconnect/ui'
import Link from 'next/link'
import { ScheduleFooter } from './schedule-footer'
import { ScheduleGrid } from './schedule-grid'
import { ScheduleHeader } from './schedule-header'

/**
 * 프로젝트 조회 실패 시 에러 화면으로 전환한다. 분기는 BE 에러 code(문자열)가 아닌
 * HTTP 상태 기준 — 404는 "없는 프로젝트", 그 외(네트워크·500 등)는 일반 오류.
 * 작업 목록 404는 #840에서 따로 다루므로 여기서 게이트하지 않는다.
 */
export function ScheduleContent({ projectId }: { projectId: string }) {
  const { error, isError } = useGetProject(Number(projectId))

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404
    return <ProjectError notFound={notFound} />
  }

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

function ProjectError({ notFound }: { notFound: boolean }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex flex-col gap-1.5">
        <p className="text-lg font-semibold text-gray-900">
          {notFound ? '프로젝트를 찾을 수 없어요' : '프로젝트를 불러오지 못했어요'}
        </p>
        <p className="text-r-14 text-gray-500">
          {notFound
            ? '주소가 잘못되었거나 접근 권한이 없는 프로젝트예요.'
            : '잠시 후 다시 시도해주세요.'}
        </p>
      </div>
      <Button asChild variant="outline" size="small">
        <Link href="/">기술자 탐색으로</Link>
      </Button>
    </div>
  )
}
