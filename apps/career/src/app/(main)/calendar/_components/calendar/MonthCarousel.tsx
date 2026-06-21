'use client'

import { monthShift } from './date-helpers'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@bconnect/ui'
import { useEffect, useState } from 'react'
import { useMonthTasks } from '@/app/(main)/calendar/_hooks/useMonthTasks'
import { CalendarMonth } from './CalendarMonth'

interface MonthCarouselProps {
  month: string
  selectedDay: string
  onSelectDay: (iso: string) => void
  onMonthChange: (monthIso: string) => void
}

/** 한 슬라이드 = 한 달. 슬라이드마다 자체 조회(React Query 키로 dedup/프리페치). */
function MonthSlide({
  month,
  selectedDay,
  onSelectDay,
}: {
  month: string
  selectedDay: string
  onSelectDay: (iso: string) => void
}) {
  const { tasks } = useMonthTasks(month)
  return (
    <CalendarMonth
      monthIso={month}
      tasks={tasks}
      selectedDay={selectedDay}
      onSelectDay={onSelectDay}
    />
  )
}

/**
 * 모바일 좌우 스와이프 월 이동. [prev, current, next] 3슬라이드를 startIndex 1 로 띄우고,
 * 측면 슬라이드로 착지하면 ?month= 를 갱신 → 슬라이드 재구성 후 무애니로 중앙(1) 복귀.
 */
export function MonthCarousel({
  month,
  selectedDay,
  onSelectDay,
  onMonthChange,
}: MonthCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const months = [monthShift(month, -1), month, monthShift(month, 1)]

  useEffect(() => {
    if (!api) return
    const onSelect = () => {
      const snap = api.selectedScrollSnap()
      if (snap === 1) return
      onMonthChange(monthShift(month, snap - 1))
    }
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api, month, onMonthChange])

  // month(자식 슬라이드) 변경 시 중앙으로 무애니 재정렬
  useEffect(() => {
    if (api) api.scrollTo(1, true)
  }, [api, month])

  return (
    <Carousel setApi={setApi} opts={{ startIndex: 1, watchDrag: true }} className="w-full">
      <CarouselContent className="ml-0">
        {months.map((m) => (
          <CarouselItem key={m} className="pl-0">
            <MonthSlide month={m} selectedDay={selectedDay} onSelectDay={onSelectDay} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
