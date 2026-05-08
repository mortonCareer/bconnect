import { Role } from '@morton/api-client'

export const ROLE_LABELS: Record<Role, string> = {
  [Role.GUEST]: '게스트',
  [Role.CLIENT]: '소비자',
  [Role.ARCHITECT]: '건축사',
  [Role.CONTRACTOR]: '건설업자',
  [Role.FOREMAN]: '반장',
  [Role.SKILLED]: '기공',
  [Role.SEMI_SKILLED]: '준기공',
  [Role.HELPER]: '조공',
  [Role.ADMIN]: '관리자',
}

export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role
}

/** 회원가입 시 선택 가능한 유형 (Figma 기준) */
export const SIGNUP_ROLES: Role[] = [
  Role.CLIENT,
  Role.ARCHITECT,
  Role.CONTRACTOR,
  Role.FOREMAN,
  Role.SKILLED,
  Role.SEMI_SKILLED,
  Role.HELPER,
]
