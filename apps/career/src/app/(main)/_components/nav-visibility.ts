export function isChatDetailRoute(pathname: string): boolean {
  return /^\/messages\/\d+/.test(pathname)
}

export function isBottomNavHidden(pathname: string): boolean {
  return (
    isChatDetailRoute(pathname) ||
    /^\/profile\/edit(\/|$)/.test(pathname) ||
    /^\/calendar\/new(\/|$)/.test(pathname) ||
    // 동산보드 서브라우트(폴더·업로드)는 앱바(← 뒤로)로 진입 — 하단 네비 숨김. /storage 루트는 유지.
    /^\/storage\/.+/.test(pathname)
  )
}
