/**
 * @figma-scaffold 폼 전역 에러 표시 — useServerError 의 formError 를 받아 role="alert" 로 렌더 (#400)
 */
import { cn } from '../../lib/utils'

interface FormErrorProps {
  /** 표시할 에러 메시지. falsy 면 컴포넌트가 null 반환 (조건부 렌더 불필요). */
  error?: string
  className?: string
}

/**
 * 폼 전역 에러 메시지 슬롯.
 *
 * `useServerError` 의 `formError` (field 없이 매핑된 서버 에러) 를 받는 표준 위치.
 * `role="alert"` 로 스크린리더에 즉시 알림. error 가 falsy 면 렌더 안 함 — 호출부의
 * `{error && <p>...</p>}` 보일러플레이트 제거.
 *
 * @example
 *   <FormError error={server.formError} />
 */
export function FormError({ error, className }: FormErrorProps) {
  if (!error) return null
  return (
    <p role="alert" className={cn('text-sm text-destructive', className)}>
      {error}
    </p>
  )
}
