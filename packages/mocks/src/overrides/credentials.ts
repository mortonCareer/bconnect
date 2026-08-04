import {
  CredentialStatus,
  CredentialType,
  getGetCredentialsMockHandler,
  getGetMyCredentialsMockHandler,
  getCreateCredentialMockHandler,
  getDeleteCredentialMockHandler,
  getCreateAttachmentPresignMockHandler,
  getCreateAttachmentConfirmMockHandler,
} from '@bconnect/api-client'
import type {
  Attachment,
  ConfirmRequest,
  CreateCredentialRequest,
  Credential,
  PresignRequest,
  PresignedFile,
} from '@bconnect/api-client'
import { http, HttpResponse } from 'msw'

let nextId = 1
const cred = (
  type: CredentialType,
  status: CredentialStatus,
  expiredAt: string | null
): Credential => ({
  id: nextId++,
  memberId: 1,
  type,
  status,
  expiredAt,
  note: null,
  attachment: null,
  createdAt: '2026-01-01T00:00:00Z',
  modifiedAt: '2026-01-01T00:00:00Z',
})

/**
 * 자격 증명 신청 서브탭별 상태 검증용 고정 데이터.
 * ≥2 케이스(리스트)와 빈 케이스를 서브탭마다 분배:
 *   - 원클릭: 본인인증(삭제불가) + 사업자 + 면허 (리스트)
 *   - 증명서: 경력=2(리스트) / 기능등급=빈 / 그외=2(리스트)
 *   - 자격증: 국가기술=2(리스트) / 숙련기술인=빈 / 그외=빈
 */
const CREDENTIALS: Credential[] = [
  cred(CredentialType.IDENTITY_VERIFICATION, CredentialStatus.ACCEPTED, null),
  cred(CredentialType.SOLE_PROPRIETOR, CredentialStatus.ACCEPTED, '2026-09-21'),
  cred(CredentialType.CONSTRUCTION_LICENSE, CredentialStatus.ACCEPTED, '2027-09-21'),

  cred(CredentialType.CAREER_CERTIFICATE, CredentialStatus.ACCEPTED, '2027-02-18'),
  cred(CredentialType.CAREER_CERTIFICATE, CredentialStatus.ACCEPTED, '2028-05-10'),
  cred(CredentialType.OTHER_CERTIFICATE, CredentialStatus.ACCEPTED, null),
  cred(CredentialType.OTHER_CERTIFICATE, CredentialStatus.PENDING, null),

  cred(CredentialType.NATIONAL_TECHNICAL_QUALIFICATION, CredentialStatus.ACCEPTED, '2027-02-18'),
  cred(CredentialType.NATIONAL_TECHNICAL_QUALIFICATION, CredentialStatus.ACCEPTED, '2029-11-30'),
]

// presign → PUT → confirm 업로드 체인 (#340 계약)의 CREDENTIAL 소비분. presign 이
// pending 첨부를 만들고, createCredential 이 attachmentId 로 집어 credential 에 바인딩.
// ⚠️ presign/confirm 핸들러는 컨텍스트 공용 엔드포인트 — #806(drives)에도 같은 override 가
// 있어 둘 다 머지되면 하나로 통합 필요.
let nextAttachmentId = 1
const pendingAttachments = new Map<number, Attachment>()

export const credentialsOverrides = [
  getGetCredentialsMockHandler(() => CREDENTIALS),
  getGetMyCredentialsMockHandler(() => CREDENTIALS),
  getCreateCredentialMockHandler(async ({ request }) => {
    const body = (await request.json()) as CreateCredentialRequest
    const created = cred(body.type, CredentialStatus.ACCEPTED, body.expiredAt ?? null)
    if (body.attachmentId != null) {
      created.attachment = pendingAttachments.get(body.attachmentId) ?? null
      pendingAttachments.delete(body.attachmentId)
    }
    CREDENTIALS.push(created)
    return created.id ?? 0
  }),
  getCreateAttachmentPresignMockHandler(async ({ request }): Promise<PresignedFile[]> => {
    const body = (await request.json()) as PresignRequest
    return body.files.map((f) => {
      const id = nextAttachmentId++
      const stamp = new Date().toISOString()
      pendingAttachments.set(id, {
        id,
        memberId: 1,
        type: body.type,
        filename: f.filename,
        contentType: f.contentType,
        size: f.size,
        createdAt: stamp,
        modifiedAt: stamp,
        url: `/mock-s3/${id}`,
      })
      return { id, uploadUrl: `/mock-s3/${id}` }
    })
  }),
  // presigned PUT 수신부 — 실 S3 대역. 바이트는 버린다.
  http.put('*/mock-s3/:id', () => new HttpResponse(null, { status: 200 })),
  getCreateAttachmentConfirmMockHandler(async ({ request }): Promise<Attachment[]> => {
    const body = (await request.json()) as ConfirmRequest
    return body.attachmentIds
      .map((id) => pendingAttachments.get(id))
      .filter((a): a is Attachment => a != null)
  }),
  getDeleteCredentialMockHandler(({ params }) => {
    const index = CREDENTIALS.findIndex((c) => c.id === Number(params.credentialId))
    if (index !== -1) CREDENTIALS.splice(index, 1)
    return { success: true }
  }),
]
