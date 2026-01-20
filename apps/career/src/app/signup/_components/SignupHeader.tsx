'use client'

import { BackButton, ProgressBar } from '@morton/ui'

interface SignupHeaderProps {
  step: number
  total?: number
  onBack: () => void
}

export function SignupHeader({ step, total = 3, onBack }: SignupHeaderProps) {
  return (
    <header className="flex h-[60px] items-center justify-between px-4 py-5">
      <BackButton onClick={onBack} />
      <ProgressBar step={step} total={total} />
      <div className="size-5" /> {/* Spacer for alignment */}
    </header>
  )
}
