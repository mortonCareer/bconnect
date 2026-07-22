/**
 * 작업(Task) 색 배정 SSOT — task.id % 팔레트 길이, 순수 결정적(상태·공종 무관).
 * 캘린더 바와 작업 선택 점이 같은 규칙을 공유해 같은 작업 = 같은 색 계열.
 * bar/dot 을 한 항목으로 묶어 팔레트 수정 시 페어 드리프트를 막는다.
 */
const TASK_COLOR_FAMILIES = [
  { bar: 'bg-rose-100 text-rose-600', dot: 'bg-rose-500' },
  { bar: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { bar: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { bar: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { bar: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
] as const

function family(id: number) {
  return TASK_COLOR_FAMILIES[id % TASK_COLOR_FAMILIES.length] ?? TASK_COLOR_FAMILIES[0]
}

/** 캘린더 작업 바 (소프트 파스텔 배경 + 진한 텍스트). */
export function barColor(id: number): string {
  return family(id).bar
}

/** 작업 선택 리스트 점 (진한 단색). */
export function dotColor(id: number): string {
  return family(id).dot
}
