/**
 * @figma-scaffold ImageInput 합성 폼 래퍼 — label/description/error + RHF(control+name) 배선 (#424)
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
import { ImageInput, type ImageInputProps, type ImageValue } from '../ImageInput'

interface ImageFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  multiple?: boolean
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
  disabled?: boolean
  className?: string
  /** 필드 라벨 (생략 시 라벨 없음) */
  label?: string
  /** 입력 위 설명문 (생략 가능) */
  description?: string
  /** 입력 아래 보조 텍스트 — 에러(zod ∪ serverError) 발생 시 에러 메시지가 대체 */
  hint?: string
  /** 필수 입력 표시 — 라벨 옆 빨간 별표. 검증은 zod 가 담당. */
  required?: boolean
  /** useServerError 의 fieldError 결과 — zod 클라이언트 에러와 한 슬롯에 합성. */
  serverError?: string
}

type RHFFieldArg = {
  value: ImageValue | ImageValue[] | null
  onChange: (v: ImageValue | ImageValue[] | null) => void
  onBlur: () => void
  ref: React.Ref<HTMLButtonElement>
}

/** FormItem 안에서 useFormField 로 aria id 합성 (zod ∪ serverError) 후 ImageInput 에 주입. */
function ImageFieldControl({
  field,
  serverError,
  ...rest
}: {
  field: RHFFieldArg
  serverError?: string
} & Pick<
  ImageInputProps,
  'multiple' | 'maxFiles' | 'maxSizeMB' | 'accept' | 'disabled' | 'className'
>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  const invalid = !!error || !!serverError
  return (
    <ImageInput
      {...rest}
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
 * `SelectField` 의 이미지 버전 — `ImageInput` primitive 에 label/description/error +
 * RHF(control+name) 폼 데코를 더한다. 폼이 아닌 제어 상태는 `ImageInput` 을 직접 쓴다.
 *
 * 표준·레시피: docs/how-to/frontend-forms.md, 근거: ADR 0013.
 */
export function ImageField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  hint,
  required,
  serverError,
  multiple,
  maxFiles,
  maxSizeMB,
  accept,
  disabled,
  className,
}: ImageFieldProps<T>) {
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
            <ImageFieldControl
              field={field as unknown as RHFFieldArg}
              serverError={serverError}
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
