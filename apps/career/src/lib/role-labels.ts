import { Role } from '@morton/api-client'

export const ROLE_LABELS: Record<Role, string> = {
  [Role.GUEST]: '게스트',
  [Role.ARCHITECT]: '건축사',
  [Role.CONTRACTOR]: '시공사',
  [Role.FOREMAN]: '반장',
  [Role.WORKER]: '기술자',
  [Role.ADMIN]: '관리자',
}
