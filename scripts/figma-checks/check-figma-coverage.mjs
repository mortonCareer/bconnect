/**
 * Check: Figma에서 "Ready for dev" 마킹된 frame 중 코드의 @figma/@figma-state로
 * 매핑되지 않은 것을 감지.
 *
 * 디자이너의 의도적 신호("이 디자인은 코드 작업 준비됨")를 출발점으로 삼아
 * 누락 검출. 휴리스틱 prefix 매칭 없이 명시적 매칭만 사용 → false positive 0.
 *
 * 잡는 시나리오:
 * - 디자이너가 새 frame을 Ready로 표시했는데 코드에 @figma 매핑 없음
 * - 같은 페이지의 새 state(탭/상태) Ready 추가됐는데 @figma-state 누락
 * - 기존 frame은 Ready인데 코드는 다른 (Ready 아닌) frame을 가리킴
 *
 * 잡지 않는 시나리오:
 * - 디자이너가 Ready 안 마킹한 진행중 frame (의도된 미공개)
 * - @figma 마킹이 누락된 코드 (ESLint rule이 잡음, #256)
 */

const FIGMA_URL_BASE = 'https://www.figma.com/design'

/**
 * @param {import('./lib/figma-context.mjs').FigmaContext} ctx
 * @returns {Promise<import('./lib/report.mjs').Finding[]>}
 */
export async function checkFigmaCoverage(ctx) {
  const findings = []

  // 모든 코드의 매핑 노드 ID 수집 (primary + states)
  const allMappedNodeIds = new Set()
  for (const tag of ctx.codeTags) {
    if (tag.primaryNodeId) allMappedNodeIds.add(tag.primaryNodeId)
    for (const s of tag.states) allMappedNodeIds.add(s.nodeId)
  }

  // Ready frame 수집
  const readyFrames = []
  for (const node of ctx.nodes.values()) {
    if (node.devReady) readyFrames.push(node)
  }

  // 미매핑 Ready frame → drift
  const unmapped = readyFrames.filter((f) => !allMappedNodeIds.has(f.id))

  if (unmapped.length === 0) return findings

  // 부모 섹션별 그룹화 (가독성)
  const bySection = new Map()
  for (const frame of unmapped) {
    const sectionKey = frame.parentName ?? '(root)'
    if (!bySection.has(sectionKey)) bySection.set(sectionKey, [])
    bySection.get(sectionKey).push(frame)
  }

  for (const [section, frames] of bySection) {
    findings.push({
      checkName: 'figma-coverage',
      severity: 'warning',
      file: `(Figma section: ${section})`,
      message: `Figma "${section}" 섹션에 Ready 마킹된 미매핑 frame ${frames.length}개`,
      links: frames.map((f) => {
        const urlNodeId = f.id.replace(':', '-')
        return `\`${f.name}\` — ${FIGMA_URL_BASE}/${ctx.fileKey}?node-id=${urlNodeId}`
      }),
    })
  }

  // 추가: 코드의 @figma URL이 Ready 아닌 frame을 가리키는 경우 — info severity
  for (const tag of ctx.codeTags) {
    if (tag.kind !== 'figma' || !tag.primaryNodeId) continue
    const node = ctx.nodes.get(tag.primaryNodeId)
    if (!node) {
      findings.push({
        checkName: 'figma-coverage',
        severity: 'warning',
        file: tag.file,
        message: `@figma URL이 가리키는 노드(${tag.primaryNodeId})를 Figma 파일에서 찾을 수 없음 (삭제됨?)`,
        links: [tag.primaryUrl],
      })
      continue
    }
    // "Ready for Dev" 는 화면/플로우 단위 신호 — 디자이너가 화면을 Ready 마킹한다.
    // packages/ 의 디자인 시스템 컴포넌트는 빌딩 블록이라 ready/not-ready 개념이 안 맞고
    // 디자이너가 Ready 마킹하지 않는 게 정상. 따라서 이 체크는 apps/ 매핑에만 적용 (#355).
    if (!node.devReady && tag.file.startsWith('apps/')) {
      findings.push({
        checkName: 'figma-coverage',
        severity: 'info',
        file: tag.file,
        message: `@figma URL이 Ready 아닌 frame "${node.name}"을 가리킴 (디자이너에게 Ready 마킹 요청 또는 다른 frame으로 변경)`,
        links: [tag.primaryUrl],
      })
    }
  }

  return findings
}
