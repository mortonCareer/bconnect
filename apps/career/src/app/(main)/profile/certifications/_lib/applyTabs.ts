import type { CredentialType } from '@bconnect/api-client'

export const APPLY_TAB_KEYS = ['one-click', 'certificate', 'qualification'] as const
export type ApplyTabKey = (typeof APPLY_TAB_KEYS)[number]

export const CERTIFICATE_SUB_KEYS = ['career', 'skill-grade', 'other'] as const
export const QUALIFICATION_SUB_KEYS = ['national', 'skilled', 'other'] as const
export type CertificateSubKey = (typeof CERTIFICATE_SUB_KEYS)[number]
export type QualificationSubKey = (typeof QUALIFICATION_SUB_KEYS)[number]

interface SubTabMeta {
  label: string
  type: CredentialType
  title: string
  description: string
  /** 발급받기 — 발급기관 외부 사이트 링크. 그 외(other)는 발급처가 없어 생략. */
  issueHref?: string
  /** 자세히보기 — 발급기관 안내 페이지 링크. 미정이면 생략(링크 숨김). */
  detailHref?: string
}

export const CERTIFICATE_SUB_TABS: Record<CertificateSubKey, SubTabMeta> = {
  career: {
    label: '경력증명서',
    type: 'CAREER_CERTIFICATE',
    title: '경력증명서',
    description: '건설근로자공제회에 등록된 건설업 경력 현황이에요.',
    issueHref: 'https://eum.cw.or.kr/web/cer/WEBCER010M00',
    detailHref: 'https://eum.cw.or.kr/web/cer/WEBCER010M00',
  },
  'skill-grade': {
    label: '기능등급증명서',
    type: 'SKILL_GRADE_CERTIFICATE',
    title: '기능등급증명서',
    description: '건설근로자공제회 기준 기능등급 현황이에요.',
    issueHref: 'https://eum.cw.or.kr/web/cer/WEBCER011M00',
    detailHref: 'https://eum.cw.or.kr/web/cer/WEBCER011M00',
  },
  other: {
    label: '그 외',
    type: 'OTHER_CERTIFICATE',
    title: '기타 증명서',
    description: '다른 항목에 해당하지 않는 증명서에요.\n검토 후 승인된 경우에 프로필에 반영돼요.',
  },
}

export const QUALIFICATION_SUB_TABS: Record<QualificationSubKey, SubTabMeta> = {
  national: {
    label: '국가기술자격증',
    type: 'NATIONAL_TECHNICAL_QUALIFICATION',
    title: '국가기술자격증',
    description: '한국산업인력공단이 평가·운영하는 국가자격이에요.',
    issueHref: 'https://www.q-net.or.kr/isr001.do',
    detailHref: 'https://www.q-net.or.kr/qlf001.do',
  },
  skilled: {
    label: '숙련기술인',
    type: 'SKILLED_TECHNICIAN',
    title: '숙련기술인',
    description: '한국산업인력공단이 인정한 숙련기술 보유자에요.',
    issueHref: 'https://meister.hrdkorea.or.kr',
    detailHref: 'https://meister.hrdkorea.or.kr',
  },
  other: {
    label: '그 외',
    type: 'OTHER_QUALIFICATION',
    title: '기타 자격증',
    description:
      '다른 항목에 해당하지 않는 자격증이에요.\n검토 후 승인된 경우에 프로필에 반영돼요.',
  },
}

export function getApplyLocation(type: CredentialType): { tab: ApplyTabKey; sub?: string } {
  const certKey = CERTIFICATE_SUB_KEYS.find((key) => CERTIFICATE_SUB_TABS[key].type === type)
  if (certKey) return { tab: 'certificate', sub: certKey }
  const qualKey = QUALIFICATION_SUB_KEYS.find((key) => QUALIFICATION_SUB_TABS[key].type === type)
  if (qualKey) return { tab: 'qualification', sub: qualKey }
  return { tab: 'one-click' }
}
