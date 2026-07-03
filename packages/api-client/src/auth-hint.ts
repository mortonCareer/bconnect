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

export function setAuthHint() {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_HINT_COOKIE}=${Date.now()}; Max-Age=${AUTH_HINT_MAX_AGE_SECONDS}; ${cookieAttributes()}`
}

export function clearAuthHint() {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_HINT_COOKIE}=; Max-Age=0; ${cookieAttributes()}`
}
