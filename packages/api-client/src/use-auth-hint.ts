'use client'

import { useSyncExternalStore } from 'react'
import { readAuthHint, subscribeAuthHint } from './auth-hint'

/**
 * 로그인 표시 쿠키를 렌더에서 읽는다 (#1098). 표시는 이 쿠키 하나뿐이므로,
 * 갱신 실패로 쿠키가 지워지면(client.ts) 화면도 함께 로그아웃 상태가 된다.
 *
 * 서버 스냅샷은 항상 false — 쿠키는 클라이언트에서만 읽으므로, 서버 렌더 결과를
 * 그대로 hydration 에 쓰고 이후 실제 값으로 다시 렌더한다. 렌더 중 `readAuthHint()`
 * 를 직접 부르면 서버(false)와 클라이언트(true)가 갈려 hydration 이 깨진다.
 *
 * effect·이벤트 핸들러처럼 클라이언트에서만 도는 자리에서는 `readAuthHint()` 를 쓴다.
 */
export function useAuthHint(): boolean {
  return useSyncExternalStore(subscribeAuthHint, readAuthHint, () => false)
}
