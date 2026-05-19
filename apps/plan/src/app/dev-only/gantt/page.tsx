/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1573-15558
 * @figma-scaffold dev-only preview for GanttChart component verification (Issue #373).
 */
import { notFound } from 'next/navigation'

import { GanttChart } from '@/components/gantt-chart'

import { MOCK_DATE_RANGE, MOCK_TASKS } from './mock'

export default function GanttDevPage() {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
    notFound()
  }

  return (
    <main className="p-8">
      <h1 className="mb-4 text-lg font-semibold">GanttChart — dev preview</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Figma node 1573-15558 검증용 페이지. production 환경에서는 404.
      </p>
      <div className="border border-neutral-200">
        <GanttChart
          tasks={MOCK_TASKS}
          startDate={MOCK_DATE_RANGE.startDate}
          endDate={MOCK_DATE_RANGE.endDate}
          today={MOCK_DATE_RANGE.today}
        />
      </div>
    </main>
  )
}
