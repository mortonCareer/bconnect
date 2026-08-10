// 로그인 표시 쿠키 — 각 앱 proxy.ts 미들웨어 가드가 존재 여부로 로그인 상태를 낙관 판정.
// refreshToken 쿠키(BE 발급, Path=/api/v1/auth)는 페이지 요청에 실리지 않아 가드가 볼 수 없어
// 미들웨어가 볼 수 있는 위치(Path=/)에 non-sensitive 신호를 따로 둔다 (#701).
// Max-Age 는 BE refresh token TTL(7d) 과 동기화 — apps/api application.yaml 변경 시 함께 갱신.
export const AUTH_HINT_COOKIE = 'bc_auth_hint'

const AUTH_HINT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

// SameSite=Lax 필수 (Strict 금지) — Strict 면 외부 링크로 진입하는 첫 top-level 네비게이션에
// 쿠키가 실리지 않아 로그인 상태에서도 가드에 튕긴다.
const cookieAttributes = () => {
  const { hostname } = window.location
  const domain =
    hostname === 'bconnect.to' || hostname.endsWith('.bconnect.to') ? '; Domain=.bconnect.to' : ''
  return `Path=/; SameSite=Lax; Secure${domain}`
}

// 쿠키는 관찰할 수 없으므로 쓰기 통로(set/clear)가 직접 알린다. useAuthHint 구독원.
const listeners = new Set<() => void>()

export function subscribeAuthHint(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const notify = () => {
  for (const listener of listeners) listener()
}

export function setAuthHint() {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_HINT_COOKIE}=${Date.now()}; Max-Age=${AUTH_HINT_MAX_AGE_SECONDS}; ${cookieAttributes()}`
  notify()
}

export function clearAuthHint() {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_HINT_COOKIE}=; Max-Age=0; ${cookieAttributes()}`
  notify()
}

// 지금 시점 쿠키를 한 번 읽는다 — effect·이벤트 핸들러처럼 훅을 부를 수 없는 자리 전용.
// 렌더에서는 useAuthHint 를 쓴다 (서버에서 항상 false 라 hydration 이 깨지고, 값이 변해도 안 따라감).
// getAccessToken() 은 앱 진입 직후엔 로그인 유저도 null(refresh 전)이라 게이트로 못 씀.
export function readAuthHint(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((c) => c.startsWith(`${AUTH_HINT_COOKIE}=`))
}
