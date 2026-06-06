export function isChatDetailRoute(pathname: string): boolean {
  return /^\/messages\/\d+/.test(pathname)
}

export function isChromelessRoute(pathname: string): boolean {
  return isChatDetailRoute(pathname) || /^\/profile\/edit(\/|$)/.test(pathname)
}
