'use client'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@bconnect/ui'
import type { CheckItem } from '@/lib/business/types'
import { StatusBadge } from './StatusBadge'
import { DetailTable } from './DetailTable'
import { OwnerVerifyForm } from './OwnerVerifyForm'

/** Accordion 래퍼 — 서버 컴포넌트에서 children으로 Suspense 경계를 전달받음 */
export function AccordionShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Accordion type="multiple" className={className}>
      {children}
    </Accordion>
  )
}

/** 개별 AccordionItem 콘텐츠 — 서버에서 resolve된 CheckItem 데이터 렌더링 */
export function DetailAccordionItem({
  item,
  registrationNumber,
}: {
  item: CheckItem
  registrationNumber: string
}) {
  return (
    <AccordionItem value={item.id}>
      <AccordionTrigger className="gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sb-16 text-gray-900">{item.label}</span>
            <StatusBadge status={item.status} statusType={item.statusType} />
          </div>
          {item.description && <span className="text-r-12 text-gray-500">{item.description}</span>}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <DetailTable details={item.details} />
        {item.id === 'BUSINESS_STATUS' && (
          <OwnerVerifyForm registrationNumber={registrationNumber} />
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
