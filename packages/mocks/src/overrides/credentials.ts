import {
  CredentialStatus,
  CredentialType,
  getGetCredentialsMockHandler,
} from '@bconnect/api-client'
import type { Credential } from '@bconnect/api-client'

let nextId = 1
const cred = (
  type: CredentialType,
  status: CredentialStatus,
  expiredAt: string | null
): Credential => ({
  id: nextId++,
  profileId: 1,
  type,
  status,
  expiredAt,
  createdAt: '2026-01-01T00:00:00Z',
  modifiedAt: '2026-01-01T00:00:00Z',
})

/**
 * 인증 신청 서브탭별 상태 검증용 고정 데이터.
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

export const credentialsOverrides = [getGetCredentialsMockHandler(() => CREDENTIALS)]
