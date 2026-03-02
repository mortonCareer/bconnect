import { Role } from '@morton/api-client'

export const ROLE_LABELS: Record<Role, string> = {
  [Role.GUEST]: '게스트',
  [Role.CLIENT]: '의뢰인',
  [Role.ARCHITECT]: '건축사',
  [Role.CONTRACTOR]: '시공사',
  [Role.FOREMAN]: '반장',
  [Role.SKILLED]: '숙련공',
  [Role.SEMI_SKILLED]: '준숙련공',
  [Role.HELPER]: '보조',
  [Role.ADMIN]: '관리자',
}
