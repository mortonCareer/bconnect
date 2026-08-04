import { ProfileRole } from '@bconnect/api-client'

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
