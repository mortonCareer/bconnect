import type { CheckDetail } from '@/lib/business/types'

interface DetailTableProps {
  details: CheckDetail[]
}

export function DetailTable({ details }: DetailTableProps) {
  if (details.length === 0) return null

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300">
      {details.map((detail, index) => (
        <div key={detail.key} className={`flex ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
          <div className="w-50 shrink-0 px-3 py-2 text-r-14 text-gray-500">{detail.key}</div>
          <div className="flex-1 px-3 py-2 text-r-14 text-gray-900">{detail.value}</div>
        </div>
      ))}
    </div>
  )
}
