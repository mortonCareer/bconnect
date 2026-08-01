// PUBLIC route — proxy 의 인증 가드와 RequireRole 의 역할 가드가 함께 보는 단일 목록.
// matcher 의 제외 대상과 위계가 다르다: matcher 제외는 middleware 자체가 실행되지 않는 path.
const PUBLIC_EXACT = ['/']
const PUBLIC_PREFIX = ['/login', '/signup', '/privacy', '/terms', '/monitoring']

/** ?panel= 로 열리는 패널 중 로그인이 필요한 것들. '/' 가 public 이어도 이 패널이 열려 있으면 보호로 뒤집힌다. */
const PROTECTED_PANELS = ['messages', 'notifications', 'task']

export function isPublicPath(pathname: string, searchParams: URLSearchParams): boolean {
  const panelRoot = searchParams.get('panel')?.split('/')[0]
  const hasProtectedPanel =
    PUBLIC_EXACT.includes(pathname) &&
    panelRoot !== undefined &&
    PROTECTED_PANELS.includes(panelRoot)

  if (hasProtectedPanel) return false

  return PUBLIC_EXACT.includes(pathname) || PUBLIC_PREFIX.some((path) => pathname.startsWith(path))
}
