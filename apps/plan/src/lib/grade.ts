// 기술자 직급(기능 등급). BE #211 구현 전까진 fixture(technicians.ts 의 grade 필드) 기반 필터.
// TODO: BE #211 구현 후 실제 grade enum/응답으로 교체.
export const GRADE_VALUES = ['조공', '준기공', '기공', '반장'] as const

export type Grade = (typeof GRADE_VALUES)[number]

// 값 == 표시 라벨 (조공/준기공/기공/반장 자체가 라벨).
export const GRADE_OPTIONS: { value: Grade; label: string }[] = GRADE_VALUES.map((g) => ({
  value: g,
  label: g,
}))
