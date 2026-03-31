import type { CredentialType } from '@morton/api-client'

export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  IDENTITY_VERIFICATION: '본인인증',
  SOLE_PROPRIETOR: '개인사업자',
  CONSTRUCTION_LICENSE: '건설면허',
  SPECIALTY_CONSTRUCTION_LICENSE: '전문건설면허',
  CAREER_CERTIFICATE: '경력증명서',
  SKILL_GRADE_CERTIFICATE: '기능등급증명서',
  OTHER_CERTIFICATE: '기타 증명서',
  NATIONAL_TECHNICAL_QUALIFICATION: '국가기술자격증',
  SKILLED_TECHNICIAN: '숙련기술인',
  OTHER_QUALIFICATION: '기타 자격증',
}

export function getCredentialLabel(type: CredentialType): string {
  return CREDENTIAL_TYPE_LABELS[type] ?? type
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

// TODO: API 연동 후 제거 — 발표용 mock 데이터
export const MOCK_CREDENTIALS = [
  {
    id: 1,
    type: 'IDENTITY_VERIFICATION' as const,
    status: 'ACCEPTED' as const,
    expiredAt: undefined,
  },
  { id: 2, type: 'SOLE_PROPRIETOR' as const, status: 'ACCEPTED' as const, expiredAt: '2026-09-21' },
  {
    id: 3,
    type: 'SPECIALTY_CONSTRUCTION_LICENSE' as const,
    status: 'ACCEPTED' as const,
    expiredAt: '2027-09-21',
  },
  { id: 4, type: 'CAREER_CERTIFICATE' as const, status: 'ACCEPTED' as const, expiredAt: undefined },
  {
    id: 5,
    type: 'SKILL_GRADE_CERTIFICATE' as const,
    status: 'ACCEPTED' as const,
    expiredAt: '2027-02-18',
  },
  {
    id: 6,
    type: 'NATIONAL_TECHNICAL_QUALIFICATION' as const,
    status: 'ACCEPTED' as const,
    expiredAt: '2026-02-18',
  },
]
