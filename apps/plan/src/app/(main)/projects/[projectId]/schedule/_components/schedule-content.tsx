'use client'

import { ApiError, useGetProject } from '@bconnect/api-client'
import { Button } from '@bconnect/ui'
import Link from 'next/link'
import { ScheduleFooter } from './schedule-footer'
import { ScheduleGrid } from './schedule-grid'
import { ScheduleHeader } from './schedule-header'

// BE CommonExceptionCode.NOT_FOUND — 없는 프로젝트 조회 시 반환되는 404 코드.
const PROJECT_NOT_FOUND_CODE = 'C005'

/**
 * 공정표 진입 게이트 — 없는 프로젝트 주소면 404 를 받아 안내 화면을 띄운다 (#852).
 * 프로젝트가 유효한데 작업만 0건인 경우(빈 공정표)는 정상 흐름으로 통과 — 빈 목록이 404 로 오는
 * 서버 문제는 #840 별도 트랙이라 여기서 tasks 404 로 판단하지 않고 프로젝트 조회 404 만 게이트한다.
 * 네트워크 오류·500 등은 not-found 로 오인하지 않도록 C005(프로젝트 없음)만 좁혀 게이트한다.
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
