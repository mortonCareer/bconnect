import { getChoseong } from 'es-hangul'

/**
 * 한글 초성 + 부분 문자열 검색 매처.
 * - substring: "도" → "도배", 영문/숫자 포함 매칭
 * - 초성: "ㄷㅂ" → "도배" (getChoseong 비교)
 *
 * @example matchHangul('도배 기술자', 'ㄷㅂ') // true
 */
export function matchHangul(target: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const t = target.toLowerCase()
  if (t.includes(q)) return true
  return getChoseong(t).includes(getChoseong(q))
}
