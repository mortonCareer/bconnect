import type { CompanyInfo } from '@/lib/business/types'
import { ShareButton } from './ShareButton'

interface CompanyHeaderProps {
  company: CompanyInfo
}

export function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-baseline gap-3">
        <h2 className="text-sb-24 text-gray-900">{company.name}</h2>
        <span className="text-r-14 text-gray-500">{company.registrationNumber}</span>
      </div>
      <ShareButton />
    </div>
  )
}
