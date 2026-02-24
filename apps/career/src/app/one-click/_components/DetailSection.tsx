'use client'

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@morton/ui'
import type { CheckItem } from './types'
import { CATEGORY_GROUPS } from './constants'
import { StatusBadge } from './StatusBadge'
import { DetailTable } from './DetailTable'
import { OwnerVerifyForm } from './OwnerVerifyForm'

interface DetailSectionProps {
  checkItems: CheckItem[]
  registrationNumber: string
}

export function DetailSection({ checkItems, registrationNumber }: DetailSectionProps) {
  const itemMap = new Map(checkItems.map((item) => [item.id, item]))

  return (
    <div className="flex flex-col gap-8">
      {CATEGORY_GROUPS.map((group) => {
        const groupItems = group.itemIds
          .map((id) => itemMap.get(id))
          .filter((item): item is CheckItem => item != null)

        if (groupItems.length === 0) return null

        return (
          <section key={group.id}>
            <h3 className="text-sb-20 text-morton-gray-900">{group.label}</h3>
            {group.id === 'WAGE_RESTRICTION' && (
              <p className="mt-1 text-r-12 text-morton-gray-500">
                공표기간이 지난 정보는 표시되지 않습니다
              </p>
            )}

            <Accordion type="multiple" className="mt-3">
              {groupItems.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="gap-3">
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sb-16 text-morton-gray-900">
                          {item.label}
                        </span>
                        <StatusBadge
                          status={item.status}
                          statusType={item.statusType}
                        />
                      </div>
                      {item.description && (
                        <span className="text-r-12 text-morton-gray-500">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <DetailTable details={item.details} />
                    {item.id === 'BUSINESS_STATUS' && (
                      <OwnerVerifyForm registrationNumber={registrationNumber} />
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )
      })}
    </div>
  )
}
