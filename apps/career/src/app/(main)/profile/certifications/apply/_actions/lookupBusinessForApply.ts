'use server'

import { fetchOwnerVerification, fetchCheckItemById } from '@/lib/business/fetch-business'
import type { CheckItem, CheckItemId } from '@/lib/business/types'

const APPLY_CHECK_ITEM_IDS = [
  'BUSINESS_STATUS',
  'CONSTRUCTION_LICENSE',
  'SPECIALTY_LICENSE',
] as const satisfies readonly CheckItemId[]

export interface LookupBusinessForApplyResult {
  valid: boolean
  message: string
  checkItems?: CheckItem[]
}

export async function lookupBusinessForApply(
  registrationNumber: string,
  ownerName: string,
  openDate: string
): Promise<LookupBusinessForApplyResult> {
  const verification = await fetchOwnerVerification(registrationNumber, ownerName, openDate)
  if (!verification.valid) {
    return { valid: false, message: verification.message }
  }

  const checkItems = await Promise.all(
    APPLY_CHECK_ITEM_IDS.map((id) => fetchCheckItemById(id, registrationNumber))
  )
  return { valid: true, message: verification.message, checkItems }
}
