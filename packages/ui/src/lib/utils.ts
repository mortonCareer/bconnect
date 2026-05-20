import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// TODO: extendTailwindMerge 로 커스텀 타이포 유틸(text-m-*, text-r-*, text-sb-*)을
//       font-size class-group 으로 등록. 현재 twMerge 가 이들을 text-{color} 와 같은
//       충돌 그룹으로 오판 → cn() 안에서 색상 클래스와 함께 쓰면 타이포 클래스가 제거됨.
//       (apps/plan TechnicianCard 의 SkillTag 가 이 문제로 text-[12px] 직접 값 우회 중)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
