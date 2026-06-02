/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1608-7979
 */
'use client'

import * as React from 'react'
import { Slider as SliderPrimitive } from 'radix-ui'

import { cn } from '../../lib/utils'

export interface SliderProps extends Omit<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  'children'
> {
  /** 각 thumb 위에 띄울 배지 텍스트 포매터. 미지정 시 배지 미표시. */
  formatLabel?: (value: number) => string
  /** 트랙 위 step dot 표시 (기본 true) */
  showSteps?: boolean
  /** 트랙 양옆 min/max 끝 라벨 표시 (기본 true) */
  showEndLabels?: boolean
  /** thumb 별 aria-label (스크린리더 컨텍스트). value 순서대로 매핑. */
  thumbLabels?: string[]
}

/**
 * Slider (Morton 디자인 시스템) — shadcn/radix Slider 구조 기반, 범위(dual-handle) 지원.
 *
 * `value`(또는 `defaultValue`) 배열 길이만큼 thumb 를 렌더한다. `[min, max]` 형태면 dual-handle.
 * 키보드/터치 a11y 는 radix 가 제공 (방향키 step 이동, role=slider, aria-valuenow 등).
 *
 * Figma: 경력 범위 슬라이더 node 1608-7979.
 *
 * @example
 * ```tsx
 * const [range, setRange] = useState([0, 6])
 * <Slider
 *   value={range}
 *   onValueChange={setRange}
 *   min={0}
 *   max={10}
 *   formatLabel={(n) => `${n}년`}
 *   thumbLabels={['최소 경력', '최대 경력']}
 * />
 * ```
 */
function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 10,
  step = 1,
  formatLabel,
  showSteps = true,
  showEndLabels = true,
  thumbLabels,
  ...props
}: SliderProps) {
  const values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max]
  )

  const stepDots = Math.max(0, Math.floor((max - min) / step) + 1)

  return (
    <div className={cn('flex items-center gap-2.5 pt-10', className)}>
      {showEndLabels && <span className="shrink-0 text-m-12 text-gray-500">{min}</span>}

      <SliderPrimitive.Root
        data-slot="slider"
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        className="relative flex flex-1 touch-none items-center select-none data-[disabled]:opacity-50"
        {...props}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-100"
        >
          {showSteps && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-between">
              {Array.from({ length: stepDots }, (_, i) => (
                <span key={i} className="size-2 shrink-0 rounded-full bg-gray-300" />
              ))}
            </div>
          )}
          <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>

        {values.map((thumbValue, i) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={i}
            aria-label={thumbLabels?.[i]}
            className="group/thumb relative block size-3 shrink-0 cursor-pointer rounded-full transition-[box-shadow] focus-visible:ring-4 focus-visible:ring-primary/30 focus-visible:outline-none data-[disabled]:pointer-events-none"
          >
            {/* 핸들 원 — 사용 가능할 때 hover 시 살짝 확대 */}
            <span className="absolute inset-0 rounded-full border-[3px] border-primary bg-white transition-transform duration-150 group-hover/thumb:scale-125" />
            {formatLabel && (
              <span className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded-lg bg-secondary px-2 py-1 text-m-12 whitespace-nowrap text-primary">
                {formatLabel(thumbValue)}
              </span>
            )}
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>

      {showEndLabels && <span className="shrink-0 text-m-12 text-gray-500">{max}</span>}
    </div>
  )
}

export { Slider }
