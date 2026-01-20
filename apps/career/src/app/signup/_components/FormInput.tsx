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
          'flex h-[50px] items-center rounded-lg border border-[#E5E7EB] px-3 py-[7px]',
          error && 'border-[#FF4242]',
          props.disabled && 'opacity-50'
        )}
      >
        <input
          ref={ref}
          className={cn(
            'w-full bg-transparent text-base leading-[1.6] text-[#1B1B1B] placeholder:text-[#9C9C9C] focus:outline-none disabled:cursor-not-allowed',
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
