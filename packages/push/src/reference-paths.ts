import type { NotificationReferenceType } from '@bconnect/api-client'
import type { PushReferenceType } from './push-data'

export type ReferencePathMap = Partial<Record<NotificationReferenceType, string>>

/** REST 응답은 대문자 enum, 푸시 data 는 소문자 — 둘 다 받아 대문자로 정규화한다. */
export function resolveReferenceHref(
  map: ReferencePathMap,
  referenceType: NotificationReferenceType | PushReferenceType | null | undefined,
  referenceId: number | string | null | undefined
): string | undefined {
  const key = referenceType?.toUpperCase() as NotificationReferenceType | undefined
  const pattern = key ? map[key] : undefined
  if (!pattern) return undefined
  if (!pattern.includes('{id}')) return pattern
  if (referenceId == null || referenceId === '') return undefined
  return pattern.replaceAll('{id}', String(referenceId))
}
