// PUBLIC route — proxy 의 인증 가드와 RequireRole 의 역할 가드가 함께 보는 단일 목록.
// matcher 의 제외 대상과 위계가 다르다: matcher 제외는 middleware 자체가 실행되지 않는 path.
const PUBLIC_EXACT = ['/']
const PUBLIC_PREFIX = ['/signup', '/privacy', '/terms', '/monitoring', '/instagram']

/** /profile/123 및 그 하위(/coworkers·/recommendations 등) 타인 프로필은 public, /profile (내 프로필)과 /profile/edit는 보호 */
const PUBLIC_PROFILE_PATTERN = /^\/profile\/\d+(\/.*)?$/

export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIX.some((path) => pathname.startsWith(path)) ||
    PUBLIC_PROFILE_PATTERN.test(pathname)
  )
}
