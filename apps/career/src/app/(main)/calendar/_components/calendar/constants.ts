/** 한 주(週)행에 렌더할 최대 바 레인. 초과분은 "+N" 으로 접힘. */
export const MAX_LANES = 2

/** 작업 바 색 팔레트 — id 기반 안정 인덱스. (디자인: 소프트 파스텔 바) */
export const BAR_PALETTE = [
  'bg-rose-100 text-rose-600',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
] as const

export function barColor(colorIndex: number): string {
  return BAR_PALETTE[colorIndex % BAR_PALETTE.length] ?? BAR_PALETTE[0]
}
