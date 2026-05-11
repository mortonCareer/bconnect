'use client'

import { TopBar } from '@bconnect/ui'

interface SignupHeaderProps {
  step: number
  total?: number
  onBack: () => void
}

export function SignupHeader({ step, total = 3, onBack }: SignupHeaderProps) {
  return <TopBar variant="progress" step={step} totalSteps={total} onBack={onBack} />
}
