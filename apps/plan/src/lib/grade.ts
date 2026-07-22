import { ProfileRole } from '@bconnect/api-client'

// 기술자 직급(기능 등급). BE Profile.role(ProfileRole) 중 기술자 등급 4종의 표시 도메인.
export const GRADE_VALUES = ['조공', '준기공', '기공', '반장'] as const

export type Grade = (typeof GRADE_VALUES)[number]

// 값 == 표시 라벨 (조공/준기공/기공/반장 자체가 라벨).
export const GRADE_OPTIONS: { value: Grade; label: string }[] = GRADE_VALUES.map((g) => ({
  value: g,
  label: g,
}))

// 기술자 외 role(CONTRACTOR/CLIENT/ARCHITECT)은 직급 없음 → undefined.
export const PROFILE_ROLE_TO_GRADE: Partial<Record<ProfileRole, Grade>> = {
  [ProfileRole.HELPER]: '조공',
  [ProfileRole.SEMI_SKILLED]: '준기공',
  [ProfileRole.SKILLED]: '기공',
  [ProfileRole.FOREMAN]: '반장',
}
