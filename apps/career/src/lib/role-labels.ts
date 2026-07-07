import { ProfileRole } from '@bconnect/api-client'

export const ROLE_LABELS: Record<ProfileRole, string> = {
  [ProfileRole.CLIENT]: '소비자',
  [ProfileRole.ARCHITECT]: '건축사',
  [ProfileRole.CONTRACTOR]: '건설업자',
  [ProfileRole.FOREMAN]: '반장',
  [ProfileRole.SKILLED]: '기공',
  [ProfileRole.SEMI_SKILLED]: '준기공',
  [ProfileRole.HELPER]: '조공',
}

export function getRoleLabel(role: ProfileRole): string {
  return ROLE_LABELS[role] ?? role
}

/** 회원가입 시 선택 가능한 유형 (Figma 기준) */
export const SIGNUP_ROLES: ProfileRole[] = [
  ProfileRole.CLIENT,
  ProfileRole.ARCHITECT,
  ProfileRole.CONTRACTOR,
  ProfileRole.FOREMAN,
  ProfileRole.SKILLED,
  ProfileRole.SEMI_SKILLED,
  ProfileRole.HELPER,
]

/** 홈 피드 필터에서 선택 가능한 역할 — 반장/기공/준기공/조공 (Figma 기준) */
export const FILTER_ROLES: ProfileRole[] = [
  ProfileRole.FOREMAN,
  ProfileRole.SKILLED,
  ProfileRole.SEMI_SKILLED,
  ProfileRole.HELPER,
]
