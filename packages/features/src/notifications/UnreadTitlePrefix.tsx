'use client'

import { useEffect } from 'react'
import { useUnreadNotificationCount } from './useNotifications'

/** 이미 붙어 있는 `(N) ` — 재적용 전에 벗겨내 중복 프리픽스를 막는다. */
const EXISTING_PREFIX = /^\(\d+\)\s*/

/**
 * 안읽은 알림 수를 브라우저 탭 title 앞에 `(N) ` 으로 붙인다 (#785).
 * 화면과 무관하게 항상 보이는 전역 표시라 앱 셸(`(main)` layout)에 한 번만 마운트한다.
 * 예: `(5) 공정표 | 품앗이`. 0 건이거나 비로그인(count undefined)이면 붙이지 않는다.
 *
 * title 은 두 경로로 바뀐다 — Next 가 라우트 metadata 로 쓰는 경우와, 화면이
 * useDocumentTitle 로 덮어쓰는 경우. 페이지마다 프리픽스를 심으면 전역이 될 수 없고
 * 소유자가 둘이 되어 경합하므로, head 변경을 관찰해 여기서만 재적용한다.
 * 이미 올바른 값이면 쓰지 않으므로 자기 변경으로 인한 루프는 생기지 않는다.
 */
export function UnreadTitlePrefix() {
  const unreadCount = useUnreadNotificationCount()

  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(EXISTING_PREFIX, '')
      const next = unreadCount ? `(${unreadCount}) ${base}` : base
      if (next !== document.title) document.title = next
    }

    apply()

    // <title> 은 Next 가 텍스트만 바꾸기도, 엘리먼트째 교체하기도 한다 → head 전체를 관찰.
    const observer = new MutationObserver(apply)
    observer.observe(document.head, { childList: true, characterData: true, subtree: true })
    return () => observer.disconnect()
  }, [unreadCount])

  return null
}
