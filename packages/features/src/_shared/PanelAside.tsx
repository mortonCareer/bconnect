import type { ReactNode } from 'react'

export interface PanelAsideProps {
  label: string
  children: ReactNode
}

export function PanelAside({ label, children }: PanelAsideProps) {
  return (
    <aside
      aria-label={label}
      className="fixed inset-y-0 right-0 z-40 flex w-[393px] flex-col border-l border-gray-200 bg-white shadow-[-4px_0_40px_0_rgba(0,0,0,0.10)]"
    >
      {children}
    </aside>
  )
}
