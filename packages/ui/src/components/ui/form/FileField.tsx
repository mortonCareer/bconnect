/**
 * @figma-scaffold FileInput 합성 폼 래퍼 — label/description/error + RHF(control+name) 배선 (#586)
 */
'use client'

import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from '../shadcn/form'
import { FileInput, type FileInputProps, type FileValue } from '../FileInput'

interface FileFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  multiple?: boolean
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
  label?: string
  disabled?: boolean
  className?: string
  /** 입력 위 설명문 (생략 가능) */
  description?: string
  /** 입력 아래 보조 텍스트 — 에러(zod ∪ serverError) 발생 시 에러 메시지가 대체 */
  hint?: string
  /** 필수 입력 표시 — 라벨 옆 빨간 별표. 검증은 zod 가 담당. */
  required?: boolean
  /** useServerError 의 fieldError 결과 — zod 클라이언트 에러와 한 슬롯에 합성. */
  serverError?: string
  /** FileInput 트리거 버튼 라벨 */
  triggerLabel?: string
}

type RHFFieldArg = {
  value: FileValue | FileValue[] | null
  onChange: (v: FileValue | FileValue[] | null) => void
  onBlur: () => void
  ref: React.Ref<HTMLButtonElement>
}

/** FormItem 안에서 useFormField 로 aria id 합성 (zod ∪ serverError) 후 FileInput 에 주입. */
function FileFieldControl({
  field,
  serverError,
  triggerLabel,
  ...rest
}: {
  field: RHFFieldArg
  serverError?: string
  triggerLabel?: string
} & Pick<
  FileInputProps,
  'multiple' | 'maxFiles' | 'maxSizeMB' | 'accept' | 'disabled' | 'className'
>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  const invalid = !!error || !!serverError
  return (
    <FileInput
      {...rest}
      label={triggerLabel}
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      fieldRef={field.ref}
      invalid={invalid}
      inputId={formItemId}
      describedBy={invalid ? `${formDescriptionId} ${formMessageId}` : `${formDescriptionId}`}
    />
  )
}

/**
 * `ImageField` 의 파일(문서) 버전 — `FileInput` primitive 에 label/description/error +
 * RHF(control+name) 폼 데코를 더한다. 폼이 아닌 제어 상태는 `FileInput` 을 직접 쓴다.
 *
 * 표준·레시피: docs/how-to/frontend-forms.md, 근거: ADR 0013.
 */
export function FileField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  hint,
  required,
  serverError,
  triggerLabel,
  multiple,
  maxFiles,
  maxSizeMB,
  accept,
  disabled,
  className,
}: FileFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error || !!serverError
        return (
          <FormItem className="gap-3">
            {label && (
              <FormLabel className="text-m-16 text-gray-900">
                {label}
                {required && (
                  <span className="ml-0.5 text-destructive" aria-hidden>
                    *
                  </span>
                )}
              </FormLabel>
            )}
            {description && (
              <FormDescription className="text-r-14 text-gray-500">{description}</FormDescription>
            )}
            <FileFieldControl
              field={field as unknown as RHFFieldArg}
              serverError={serverError}
              triggerLabel={triggerLabel}
              multiple={multiple}
              maxFiles={maxFiles}
              maxSizeMB={maxSizeMB}
              accept={accept}
              disabled={disabled}
              className={className}
            />
            <FormMessage>{serverError}</FormMessage>
            {hint && !hasError && <p className="text-r-14 text-gray-500">{hint}</p>}
          </FormItem>
        )
      }}
    />
  )
}
