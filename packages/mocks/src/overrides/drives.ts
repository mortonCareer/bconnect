import {
  DriveType,
  getCreateAttachmentConfirmMockHandler,
  getCreateAttachmentPresignMockHandler,
  getCreateDriveAttachmentsMockHandler,
  getCreateDriveMockHandler,
  getCreateNoteMockHandler,
  getDeleteDriveAttachmentsMockHandler,
  getDeleteDriveMockHandler,
  getDeleteNoteMockHandler,
  getGetDriveFilesMockHandler,
  getGetDriveImagesMockHandler,
  getGetDriveNotesMockHandler,
  getGetDrivesMockHandler,
  getGetMyDriveMockHandler,
  getUpdateDriveNameMockHandler,
  getUpdateNoteMockHandler,
} from '@bconnect/api-client'
import type {
  Attachment,
  ConfirmRequest,
  CreateDriveRequest,
  CreateNoteRequest,
  Drive,
  Note,
  PresignRequest,
  PresignedFile,
  UpdateDriveRequest,
  UpdateNoteRequest,
  UploadDriveRequest,
} from '@bconnect/api-client'
import { http, HttpResponse } from 'msw'

/**
 * 저장소(drives/notes/attachments) **stateful** mock (#767).
 * 폴더/메모 CRUD 와 presign → PUT → confirm → 드라이브 바인딩 업로드 체인이 모듈 메모리에
 * 반영돼 재조회 시 즉시 보인다. 하드 리로드 시 시드 리셋.
 *
 * BE 실동작 모사:
 * - GET /drives 는 projectId 필터, GET /drives/me 는 회원 접근 가능한 전체
 * - presign 은 pending 첨부 생성 + 가짜 uploadUrl(`/mock-s3/{id}`) 반환 — PUT 은 아래
 *   raw 핸들러가 200 으로 받는다 (실 S3 왕복 없음)
 * - confirm 후 POST /drives/{id}/attachments 로 바인딩돼야 이미지 목록에 나타남
 * - 업로드 이미지 url 은 placeholder (mock 은 파일 바이트를 보존하지 않음)
 */

const nowStamp = (): string => new Date().toISOString().slice(0, 19) + 'Z'

const placeholderImage = (label: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#e5e5e5"/><text x="50%" y="50%" font-size="28" fill="#a5a5a5" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  )}`

let drives: Drive[] = [
  {
    id: 1,
    type: DriveType.PROJECT,
    projectId: 1,
    title: '거실 (Mocked)',
    createdAt: '2026-02-23T00:00:00Z',
  },
  {
    id: 2,
    type: DriveType.PROJECT,
    projectId: 1,
    title: '베란다 (Mocked)',
    createdAt: '2026-01-14T00:00:00Z',
  },
  {
    id: 3,
    type: DriveType.PROJECT,
    projectId: 1,
    title: '침실 (Mocked)',
    createdAt: '2025-11-20T00:00:00Z',
  },
  {
    id: 4,
    type: DriveType.PROJECT,
    projectId: 1,
    title: '화장실 (Mocked)',
    createdAt: '2025-11-01T00:00:00Z',
  },
  {
    id: 5,
    type: DriveType.PROJECT,
    projectId: 2,
    title: '철거 현장 (Mocked)',
    createdAt: '2026-03-02T00:00:00Z',
  },
]

const attachmentOf = (id: number, label: string, createdAt: string): Attachment => ({
  id,
  memberId: 1,
  type: 'IMAGE',
  filename: `${label}.jpg`,
  contentType: 'image/jpeg',
  size: 1_000_000,
  createdAt,
  modifiedAt: createdAt,
  url: placeholderImage(label),
})

const images = new Map<number, Attachment[]>([
  [
    1,
    Array.from({ length: 6 }, (_, i) =>
      attachmentOf(i + 1, `이미지 ${i + 1}`, `2026-02-2${i}T00:00:00Z`)
    ),
  ],
])

const MEMO_BODY = `[ 작업시 주의사항 ]
작업 시간
• 평일 08:00~18:00, 토요일 08:00~16:00
• 일요일·공휴일 작업 불가
작업 중 주의
• 물 사용 작업(타일·설비) 전 아래층 사전 고지 및 방수 상태 사진 촬영
• 공용 복도·계단 자재 적치 금지
작업 후 정리
• 폐자재 관리사무소 지정 장소에만 배출
• 작업 완료 후 공용부 청소 상태 확인`

const notes = new Map<number, Note[]>([
  [
    1,
    [
      {
        id: 1,
        memberId: 1,
        content: MEMO_BODY,
        createdAt: '2025-09-22T00:00:00Z',
        modifiedAt: '2025-09-22T00:00:00Z',
      },
      {
        id: 2,
        memberId: 1,
        content: MEMO_BODY,
        createdAt: '2025-09-22T01:00:00Z',
        modifiedAt: '2025-09-22T01:00:00Z',
      },
    ],
  ],
])

// presign 됐지만 아직 드라이브에 바인딩 안 된 첨부
const pending = new Map<number, Attachment>()

let nextDriveId = 100
let nextAttachmentId = 100
let nextNoteId = 100

export const drivesOverrides = [
  getGetDrivesMockHandler((info): Drive[] => {
    const projectId = Number(new URL(info.request.url).searchParams.get('projectId'))
    return drives.filter((d) => d.type === DriveType.PROJECT && d.projectId === projectId)
  }),

  getGetMyDriveMockHandler((): Drive[] => drives),

  getCreateDriveMockHandler(async (info): Promise<number> => {
    const body = (await info.request.json()) as CreateDriveRequest
    const id = nextDriveId++
    const stamp = nowStamp()
    drives.push({
      id,
      type: body.type,
      projectId: body.projectId,
      memberId: 1,
      title: body.title,
      createdAt: stamp,
      modifiedAt: stamp,
    })
    return id
  }),

  getUpdateDriveNameMockHandler(async (info) => {
    const id = Number(info.params.id)
    const body = (await info.request.json()) as UpdateDriveRequest
    drives = drives.map((d) =>
      d.id === id ? { ...d, title: body.title, modifiedAt: nowStamp() } : d
    )
    return { success: true }
  }),

  getDeleteDriveMockHandler((info) => {
    const id = Number(info.params.id)
    drives = drives.filter((d) => d.id !== id)
    images.delete(id)
    notes.delete(id)
    return { success: true }
  }),

  getGetDriveImagesMockHandler((info): Attachment[] => images.get(Number(info.params.id)) ?? []),

  getGetDriveFilesMockHandler((): Attachment[] => []),

  getGetDriveNotesMockHandler((info): Note[] => notes.get(Number(info.params.id)) ?? []),

  getCreateNoteMockHandler(async (info): Promise<number> => {
    const body = (await info.request.json()) as CreateNoteRequest
    const id = nextNoteId++
    const stamp = nowStamp()
    if (body.driveId != null) {
      const list = notes.get(body.driveId) ?? []
      list.unshift({ id, memberId: 1, content: body.content, createdAt: stamp, modifiedAt: stamp })
      notes.set(body.driveId, list)
    }
    return id
  }),

  getUpdateNoteMockHandler(async (info) => {
    const id = Number(info.params.id)
    const body = (await info.request.json()) as UpdateNoteRequest
    for (const [driveId, list] of notes) {
      notes.set(
        driveId,
        list.map((n) => (n.id === id ? { ...n, content: body.content, modifiedAt: nowStamp() } : n))
      )
    }
    return { success: true }
  }),

  getDeleteNoteMockHandler((info) => {
    const id = Number(info.params.id)
    for (const [driveId, list] of notes) {
      notes.set(
        driveId,
        list.filter((n) => n.id !== id)
      )
    }
    return { success: true }
  }),

  getCreateAttachmentPresignMockHandler(async (info): Promise<PresignedFile[]> => {
    const body = (await info.request.json()) as PresignRequest
    return body.files.map((f) => {
      const id = nextAttachmentId++
      const stamp = nowStamp()
      pending.set(id, {
        id,
        memberId: 1,
        type: body.type,
        filename: f.filename,
        contentType: f.contentType,
        size: f.size,
        createdAt: stamp,
        modifiedAt: stamp,
        url: placeholderImage(f.filename.replace(/\.[^.]+$/, '')),
      })
      return { id, uploadUrl: `/mock-s3/${id}` }
    })
  }),

  // presigned PUT 수신부 — 실 S3 대역. 바이트는 버린다.
  http.put('*/mock-s3/:id', () => new HttpResponse(null, { status: 200 })),

  getCreateAttachmentConfirmMockHandler(async (info): Promise<Attachment[]> => {
    const body = (await info.request.json()) as ConfirmRequest
    return body.attachmentIds.map((id) => pending.get(id)).filter((a): a is Attachment => a != null)
  }),

  getCreateDriveAttachmentsMockHandler(async (info) => {
    const driveId = Number(info.params.id)
    const body = (await info.request.json()) as UploadDriveRequest
    const list = images.get(driveId) ?? []
    for (const id of body.attachmentIds) {
      const attachment = pending.get(id)
      if (attachment) {
        list.push(attachment)
        pending.delete(id)
      }
    }
    images.set(driveId, list)
    return { success: true }
  }),

  getDeleteDriveAttachmentsMockHandler((info) => {
    const driveId = Number(info.params.id)
    const attachmentId = Number(info.params.attachmentId)
    images.set(
      driveId,
      (images.get(driveId) ?? []).filter((a) => a.id !== attachmentId)
    )
    return { success: true }
  }),
]
