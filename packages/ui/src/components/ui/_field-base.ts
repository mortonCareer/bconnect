/**
 * Input·Textarea 공유 클래스 — 두 컴포넌트가 같은 디자인 토큰 (rounded, border, padding,
 * focus, disabled, aria-invalid 변이) 따르도록 SSOT. 변경 시 양쪽 자동 sync.
 *
 * 분리 이유: 디자인 시안 변경 시 한 곳만 수정. raw string 으로 양쪽에 박으면 drift 위험.
 */

/** 모든 form 필드 공통 base — width, padding, border 베이스, focus·disabled·aria-invalid 변이 */
export const FIELD_BASE_CLASSES =
  'w-full px-3 py-[7px] rounded-lg border bg-transparent text-base outline-none transition-colors placeholder:text-gray-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/50'

/** 기본 (정상) variant — 회색 보더 + primary 포커스 */
export const FIELD_DEFAULT_VARIANT_CLASSES =
  'border-gray-300 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary'

/** 에러 variant — destructive 보더·포커스. Input 의 `variant="error"` 폴백용 (TextField/TextareaField 는 aria-invalid 자동 변이를 사용). */
export const FIELD_ERROR_VARIANT_CLASSES =
  'border-destructive text-gray-900 focus:border-destructive focus:ring-1 focus:ring-destructive/50'
