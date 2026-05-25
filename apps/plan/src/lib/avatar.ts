/**
 * DiceBear Notionists 스타일 아바타 URL 생성
 * 이름을 seed로 사용하여 고유한 노션 스타일 아바타를 생성
 * TODO: apps/career/src/lib/avatar.ts 와 중복 — packages/config/avatar 로 추출 필요
 * TODO: 실제 프로필 이미지 시스템 구축 후 이 폴백 제거
 */
export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`
}
