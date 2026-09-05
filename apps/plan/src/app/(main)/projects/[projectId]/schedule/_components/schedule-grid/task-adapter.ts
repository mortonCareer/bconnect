import {
  OfferStatus,
  ROLE_LABELS,
  TaskStatus,
  TRADE_LABELS,
} from '@bconnect/api-client'
import type {
  CompanyTask,
  Offer,
  Profile,
  UpdateProjectTaskRequest,
  CreateProjectTaskRequest,
} from '@bconnect/api-client'
import type { OfferQueueItem, ScheduleTask, TaskAssignee } from './types'

/**
 * BE Task/Offer ↔ FE ScheduleTask 타입 경계. 그리드/패널/셀렉트가 쓰는 FE 모양(string id)은
 * 유지하고 변환을 이 파일 한 곳에 모은다. 섭외(status)·진행(progress) 두 축은 BE 값 그대로 쓴다.
 */

/** 드래그-생성 직후 미확정 작업의 로컬 센티널 id — 서버엔 존재하지 않음 (draft-task-store). */
export const DRAFT_TASK_ID = 'draft'

export function toNumericTaskId(id: string | null | undefined): number | null {
  if (!id || id === DRAFT_TASK_ID) return null
  const n = Number(id)
  return Number.isFinite(n) ? n : null
}

/** FE OfferQueueItem.profileId 는 실제 memberId 축 (PanelProfile 후보 구성과 동일). */
export function toOfferQueueItem(offer: Offer): OfferQueueItem {
  const trade = offer.profile?.primaryTrade
  return {
    profileId: offer.member?.id ?? 0,
    name: offer.member?.name ?? '',
    picture: offer.member?.picture ?? undefined,
    region: offer.profile?.address?.state ?? '',
    level: offer.profile ? ROLE_LABELS[offer.profile.role] : '',
    specialty: trade ? (TRADE_LABELS[trade] ?? '') : '',
    status: offer.status === OfferStatus.ACTIVE ? 'offered' : 'waiting',
  }
}

/** 섭외 확정(ASSIGNED) 작업의 대표 기술자 — task.workerId 로 조회한 Profile 에서 파생. */
export function toAssigneeFromProfile(profile: Profile): TaskAssignee {
  const trade = profile.primaryTrade
  return {
    profileId: profile.member?.id ?? 0,
    name: profile.member?.name ?? '',
    region: profile.address?.state ?? '',
    level: ROLE_LABELS[profile.role],
    specialty: trade ? (TRADE_LABELS[trade] ?? '') : '',
  }
}

export function toScheduleTask(
  task: CompanyTask,
  offers?: Offer[],
  workerProfile?: Profile
): ScheduleTask {
  const queue = offers
    ?.filter((o) => o.status === OfferStatus.ACTIVE || o.status === OfferStatus.PENDING)
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
    .map(toOfferQueueItem)
  const active = queue?.find((o) => o.status === 'offered')
  const assignee = workerProfile
    ? toAssigneeFromProfile(workerProfile)
    : active
      ? {
          profileId: active.profileId,
          name: active.name,
          region: active.region,
          level: active.level,
          specialty: active.specialty,
        }
      : undefined
  return {
    id: String(task.id),
    projectId: String(task.projectId),
    trades: task.trades,
    ganttName: task.title,
    startDate: task.start,
    endDate: task.end,
    status: task.status,
    progress: task.progress,
    request: task.requirement ?? '',
    memo: task.memo ?? '',
    // 작업 주소 = 소속 프로젝트 주소 (BE 가 주입) — 폼에선 읽기전용
    address: task.address?.street ?? '',
    addressDetail: task.address?.detail ?? '',
    // 작업 단위 업체명은 BE 저장 필드 없음 (기획 미결) — 읽기전용 빈값
    corpName: '',
    offerQueue: queue,
    assignee,
  }
}

/** FE 필드 patch 를 캐시의 BE Task 에 반영 (낙관적 업데이트용). 읽기전용 필드는 무시. */
export function applyFePatch(
  task: CompanyTask,
  patch: Partial<Omit<ScheduleTask, 'id'>>
): CompanyTask {
  return {
    ...task,
    ...(patch.trades !== undefined && { trades: patch.trades }),
    ...(patch.ganttName !== undefined && { title: patch.ganttName }),
    ...(patch.startDate !== undefined && { start: patch.startDate }),
    ...(patch.endDate !== undefined && { end: patch.endDate }),
    ...(patch.progress !== undefined && { progress: patch.progress }),
    ...(patch.request !== undefined && { requirement: patch.request }),
    ...(patch.memo !== undefined && { memo: patch.memo }),
  }
}

/** UpdateProjectTaskRequest 는 부분 patch 불가 — 캐시 병합본을 풀바디 직렬화. */
export function toUpdateRequest(task: CompanyTask): UpdateProjectTaskRequest {
  return {
    trades: task.trades,
    start: task.start,
    end: task.end,
    progress: task.progress,
    title: task.title,
    requirement: task.requirement ?? '',
    memo: task.memo ?? '',
  }
}

export interface TaskFormInput {
  ganttName: string
  startDate: string
  endDate: string
  trades: ScheduleTask['trades']
  request: string
  memo: string
}

export function toCreateRequest(
  values: TaskFormInput,
  projectId: string
): CreateProjectTaskRequest {
  return {
    trades: values.trades,
    start: values.startDate,
    end: values.endDate,
    projectId: Number(projectId),
    title: values.ganttName,
    requirement: values.request,
    memo: values.memo,
  }
}
