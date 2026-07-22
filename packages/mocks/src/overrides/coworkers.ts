import { getGetCoworkersMockHandler, getGetCoworkersResponseMock } from '@bconnect/api-client'
import type { Coworker } from '@bconnect/api-client'

const NAMES = ['이송목', '김기술', '박성실']

export const coworkersOverrides = [
  getGetCoworkersMockHandler(() => {
    const list = getGetCoworkersResponseMock()
    const template = list[0]
    if (!template) return list
    return NAMES.map(
      (name, i): Coworker => ({
        ...template,
        id: i + 1,
        member: { ...template.member, id: 100 + i, name },
      })
    )
  }),
]
