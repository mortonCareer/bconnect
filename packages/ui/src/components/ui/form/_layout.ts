import { cva } from 'class-variance-authority'

export type FieldLayout = 'stacked' | 'row'

/**
 * *Field 공통 레이아웃 변형 (#581).
 * stacked = 기존 수직 스택(라벨 위·입력 아래), row = 패널형 수평(라벨 좌측 고정폭 + 하단 구분선).
 * DOM 순서(label → control → message)는 동일 — 슬롯 클래스만 분기한다.
 */
export const fieldItem = cva('', {
  variants: {
    layout: {
      stacked: 'gap-3',
      row: 'min-h-[50px] grid-cols-[70px_1fr] content-center items-center gap-x-3 gap-y-1 border-b border-solid border-[#e5e5e5]',
    },
  },
  defaultVariants: { layout: 'stacked' },
})

export const fieldLabel = cva('', {
  variants: {
    layout: {
      stacked: 'text-m-16 text-gray-900',
      row: 'text-m-14 text-[#7b7b7b]',
    },
  },
  defaultVariants: { layout: 'stacked' },
})

/** label 외 슬롯(description/control/message/hint) — row 에선 값 컬럼(2열)에 정렬 */
export const fieldSlot = cva('', {
  variants: {
    layout: { stacked: '', row: 'col-start-2' },
  },
  defaultVariants: { layout: 'stacked' },
})

/**
 * row 레이아웃의 인라인 입력 — 박스 없이 값 텍스트처럼 보이는 input.
 * FIELD_BASE 를 유지한 채 박스 시각(border/ring/padding/height)만 중화한다 —
 * outline/disabled/transition 등 동작 클래스는 FIELD_BASE 그대로.
 */
export const ROW_INPUT_CLASSES =
  'h-auto rounded-none border-0 p-0 text-r-14 text-[#1b1b1b] placeholder:text-[#777777] focus:ring-0 aria-invalid:ring-0'
