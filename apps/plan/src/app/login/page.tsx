/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1469-4672
 *
 * Plan 로그인 페이지 — Phone OTP 인증 후 신규/기존 분기 (#318).
 *
 * 본 파일은 스캐폴딩 단계 — 시각 (퍼블리싱) 및 핵심 로직은 TODO 마커 자리에서
 * 본격 구현. 인프라/도구는 사전 정리 완료:
 *
 *   - auth-store (`@/stores/auth-store`) : OTP step 머신 + login/logout
 *   - signup-store (`@/stores/signup-store`) : wizard 상태 (#319/#320 공유)
 *   - useSendOtp / useVerifyOtp (`@bconnect/api-client`) : orval-generated mutation
 *   - useOtpTimer (`@bconnect/ui`) : OTP 카운트다운 hook (#327 추출)
 *   - phone utils (`@bconnect/config/phone`) : formatPhoneNumber / toE164 / toNationalNumber
 *
 * 결정 사항 (#318 본문 §결정사항 참조):
 *   - OTP verify 응답 `discriminator: registered` 로 신규/기존 분기
 *     - registered: true  → `login(accessToken)` + `/` 로 redirect
 *     - registered: false → `setSignupToken(...)` + `/signup/member` 로 redirect (#319)
 *   - 약관 동의는 가입 완료 CTA 시점 drawer (#321 close 사유) — 본 페이지 영향 X
 */
'use client'

// TODO (#318 본격 구현 시 활성):
// import { useState, useCallback } from 'react'
// import { useRouter } from 'next/navigation'
// import { ApiError, useSendOtp, useVerifyOtp } from '@bconnect/api-client'
// import {
//   formatPhoneNumber,
//   isValidPhoneNumber,
//   toE164,
//   toNationalNumber,
// } from '@bconnect/config/phone'
// import { useOtpTimer } from '@bconnect/ui'
// import { useAuthStore } from '@/stores/auth-store'
// import { useSignupStore } from '@/stores/signup-store'

export default function LoginPage() {
  // TODO #318: career login/page.tsx 패턴 참고하여 구현
  //   1. step 머신 (`phone` → `otp`)
  //   2. handleSendCode (useSendOtp.mutateAsync)
  //   3. handleVerifyCode (useVerifyOtp.mutateAsync)
  //      - registered: true  → login + push('/')
  //      - registered: false → setSignupToken + push('/signup/member')
  //   4. handleResend (재발송)
  //   5. useOtpTimer 로 만료 카운트다운
  //   6. ApiError code 별 에러 메시지 매핑
  //
  // 시각/퍼블리싱은 별도 단계 — Figma 노드 1469:4672 참조.
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="rounded-xl border border-[#e0e0e0] p-10">
        <h1 className="text-base text-[#777]">Plan 로그인 (스캐폴딩 — TODO)</h1>
      </div>
    </div>
  )
}
