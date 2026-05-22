'use client'

import { useState } from 'react'
import { useWatch, type Control, type FieldValues } from 'react-hook-form'

/** mapError 의 반환 형태 — field 생략 시 폼 전역 에러 */
interface ServerErrorMapping<T extends FieldValues> {
  field?: keyof T & string
  message: string
}

interface Snapshot<T extends FieldValues> extends ServerErrorMapping<T> {
  /** 제출(캡처) 시점의 폼 값 — derive 의 기준점 */
  values: T
}

export interface UseServerErrorResult<T extends FieldValues> {
  /** mutation 의 catch 에서 호출 — 잡은 에러와 제출 시점 값을 함께 캡처 */
  capture: (error: unknown, submitted: T) => void
  /** 해당 필드의 서버 에러 메시지. 입력이 제출 시점과 달라지면 undefined (derive) */
  fieldError: (field: keyof T & string) => string | undefined
  /** 폼 전역 서버 에러 메시지 (field 없이 매핑된 경우) */
  formError: string | undefined
  /** 서버 에러 수동 초기화 */
  reset: () => void
}

/**
 * react-hook-form 폼의 서버 에러를 staleness-free 로 다루는 훅.
 *
 * 서버 에러를 "제출 시점의 입력값"에 묶어 저장하고, 렌더마다 현재 입력값과
 * 비교해 파생(derive)한다. 사용자가 입력을 바꾸면 그 에러는 정의상 무효해지므로
 * 자동으로 사라진다 — `clearErrors` 를 onChange 마다 호출하는 누락-취약 패턴이
 * 필요 없다.
 *
 * 클라이언트(zod) 검증 에러는 RHF `formState.errors` 가 다루고, 이 훅은 서버
 * 에러만 담당한다. `<FormMessage>{server.fieldError('code')}</FormMessage>` 처럼
 * FormMessage children 으로 넘기면 zod 에러(우선) ∪ 서버 에러가 한 슬롯에 합성된다.
 *
 * @param control  `useForm()` 의 `control`
 * @param mapError 잡은 에러 → `{ field?, message }`. `field` 생략 시 폼 전역 에러.
 *
 * @example
 * const server = useServerError(form.control, (err) =>
 *   err instanceof ApiError && err.code === 'A003'
 *     ? { field: 'code', message: '유효하지 않은 인증번호입니다.' }
 *     : { message: '잠시 후 다시 시도해주세요.' }
 * )
 * // onSubmit catch: server.capture(err, data)
 * // 렌더: <FormMessage>{server.fieldError('code')}</FormMessage>
 */
export function useServerError<T extends FieldValues>(
  control: Control<T>,
  mapError: (error: unknown) => ServerErrorMapping<T>
): UseServerErrorResult<T> {
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null)

  // 현재 폼 값 구독 — useWatch 라야 React Compiler 호환 (form.watch() 는 비호환)
  const current = useWatch({ control }) as T

  // derive: 캡처 시점 값과 현재 값을 비교해 에러 유효성 판정
  let live: Snapshot<T> | null = null
  if (snapshot) {
    const unchanged = snapshot.field
      ? current?.[snapshot.field] === snapshot.values[snapshot.field]
      : JSON.stringify(current) === JSON.stringify(snapshot.values)
    if (unchanged) live = snapshot
  }

  return {
    capture: (error, submitted) => {
      setSnapshot({ ...mapError(error), values: submitted })
    },
    fieldError: (field) => (live?.field === field ? live.message : undefined),
    formError: live && !live.field ? live.message : undefined,
    reset: () => setSnapshot(null),
  }
}
