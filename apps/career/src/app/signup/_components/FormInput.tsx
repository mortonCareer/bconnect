'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@morton/ui'

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  rightElement?: React.ReactNode
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, rightElement, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex h-[50px] items-center rounded-[8px] border border-morton-gray-300 px-3 py-[7px]',
          error && 'border-morton-error',
          props.disabled && 'opacity-50'
        )}
      >
        <input
          ref={ref}
          className={cn(
            'w-full bg-transparent text-r-16 text-morton-gray-900 placeholder:text-morton-gray-500 focus:outline-none disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {rightElement && <div className="flex shrink-0 items-center">{rightElement}</div>}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
