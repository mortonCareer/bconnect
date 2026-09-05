/**
 * 회원가입 약관·개인정보 동의 SSOT (#733).
 * career signup/profile, plan signup/corp 가 공유 — 항목 목록·검증·기본값의 단일 진실.
 */
import { z } from 'zod'

export type ConsentKey = 'terms' | 'privacy' | 'marketing'

export interface ConsentItem {
  key: ConsentKey
  label: string
  /** "보기" 링크 대상 라우트. 없으면 링크 미노출 (예: 마케팅 수신 동의). */
  href?: string
}

/** 동의 항목 목록 — AgreementField 의 items 로 전달. 링크는 각 앱의 /terms·/privacy. */
export const CONSENT_ITEMS: ConsentItem[] = [
  { key: 'terms', label: '[필수] 이용약관 동의', href: '/terms' },
  { key: 'privacy', label: '[필수] 개인정보 수집·이용 동의', href: '/privacy' },
  { key: 'marketing', label: '[선택] 마케팅 정보 수신 동의', href: undefined },
]

/** 폼 기본값 — 전부 미동의(false). */
export const CONSENT_DEFAULT: Record<ConsentKey, boolean> = {
  terms: false,
  privacy: false,
  marketing: false,
}

/**
 * 동의 zod 필드 — 필수 2항목이 true 여야 통과. `z.object({ agreements: consentField })` 로 합성.
 * 미동의 시 항목별 에러 메시지가 AgreementField 에 노출된다.
 *
 * marketing 은 선택이라 게이트가 없다. 값 자체는 가입 요청의 `marketingConsent` 로 실려 간다.
 * "약관 전체 동의" 는 선택 항목까지 함께 켠다 (AgreementField 의 toggleAll).
 */
export const consentField = z.object({
  terms: z.boolean().refine((v) => v, '이용약관에 동의해주세요.'),
  privacy: z.boolean().refine((v) => v, '개인정보 수집·이용에 동의해주세요.'),
  marketing: z.boolean(),
})
