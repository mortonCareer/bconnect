'use client'

import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'

/**
 * 동산보드 페이지 내부 URL state (하이브리드: 폴더=path, 파일포커스·뷰모드=query).
 * - file: 포커스된 BoardImage id (목록 위 오버레이 패널 — Notion peek 패턴)
 * - view: 갤러리/리스트 뷰모드 (기본 gallery)
 */
export function useDocsParams() {
  return useQueryStates({
    file: parseAsString,
    view: parseAsStringEnum<'gallery' | 'list'>(['gallery', 'list']).withDefault('gallery'),
  })
}
