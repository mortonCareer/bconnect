/**
 * Check: 코드의 @figma URL이 가리키는 frame과 같은 부모 섹션 안에서
 * 비슷한 이름의 sibling frame이 있는데 코드의 @figma-state가 누락된 경우 감지.
 *
 * 예: 코드 @figma URL이 "프로필 - 인증 신청 (원클릭 조회)"를 가리키고,
 *     같은 섹션에 "프로필 - 인증 신청 (경력증명서)", "프로필 - 인증 신청 (자격증)" 등이 있으면
 *     코드의 @figma-state 라인 개수와 비교해서 누락 보고.
 *
 * @figma-scaffold/@figma-pending 마킹 페이지는 검사 제외.
 */

const FIGMA_URL_BASE = 'https://www.figma.com/design'

/**
 * Frame 이름에서 base prefix 추출 (variant suffix 제거)
 * - "프로필 - 인증 신청 (원클릭 조회)" → "프로필 - 인증 신청"
 * - "프로필 - 소개 (본인 View)"        → "프로필 - 소개"
 * - "프로필 - 동료"                     → "프로필 - 동료" (괄호 없음 = standalone)
 * - "프로필 - 인증"                     → "프로필 - 인증" (standalone)
 *
 * **괄호 `(...)`만 variant 표시로 인식**. " - "는 hierarchy delimiter로 보고
 * prefix로 자르지 않음 (같은 부모 안의 다른 페이지를 같은 그룹으로 묶지 않기 위함).
 *
 * @param {string} name
 * @returns {string}
 */
function extractBasePrefix(name) {
  const parenIdx = name.lastIndexOf(' (')
  if (parenIdx > 0 && name.endsWith(')')) {
    return name.slice(0, parenIdx)
  }
  return name
}

/**
 * @param {import('./lib/figma-context.mjs').FigmaContext} ctx
 * @returns {Promise<import('./lib/report.mjs').Finding[]>}
 */
export async function checkMissingStates(ctx) {
  const findings = []

  // 모든 코드 페이지가 매핑한 노드 ID 전체 set (다른 페이지의 매핑은 누락이 아님)
  const allMappedNodeIds = new Set()
  for (const tag of ctx.codeTags) {
    if (tag.primaryNodeId) allMappedNodeIds.add(tag.primaryNodeId)
    for (const s of tag.states) allMappedNodeIds.add(s.nodeId)
  }

  for (const tag of ctx.codeTags) {
    if (tag.kind !== 'figma' || !tag.primaryNodeId) continue

    const node = ctx.nodes.get(tag.primaryNodeId)
    if (!node) {
      findings.push({
        checkName: 'missing-states',
        severity: 'warning',
        file: tag.file,
        message: `@figma URL이 가리키는 노드(${tag.primaryNodeId})를 Figma 파일에서 찾을 수 없음 (삭제됨?)`,
        links: [tag.primaryUrl],
      })
      continue
    }

    if (!node.parentId) continue
    const parent = ctx.nodes.get(node.parentId)
    if (!parent) continue

    const basePrefix = extractBasePrefix(node.name)

    // 같은 부모의 형제 프레임 중 같은 prefix를 가진 것들
    const siblings = parent.childIds
      .map((id) => ctx.nodes.get(id))
      .filter((n) => !!n && (n.type === 'FRAME' || n.type === 'COMPONENT'))
      .filter((n) => extractBasePrefix(n.name) === basePrefix)

    // 자기 자신만 매칭 = standalone, 검사 패스
    if (siblings.length <= 1) continue

    // 누락 = 자기 자신 제외 + 어떤 코드에도 매핑되지 않은 sibling
    // (다른 페이지가 매핑한 sibling은 "내 페이지의 누락" 아님)
    const missing = siblings.filter(
      (s) => s.id !== tag.primaryNodeId && !allMappedNodeIds.has(s.id)
    )
    if (missing.length === 0) continue

    findings.push({
      checkName: 'missing-states',
      severity: 'warning',
      file: tag.file,
      message: `Figma에 "${basePrefix}" 계열 frame이 ${siblings.length}개 있는데 코드는 ${siblings.length - missing.length}개만 매핑 (누락 ${missing.length}개)`,
      links: missing.map((m) => {
        const urlNodeId = m.id.replace(':', '-')
        return `\`${m.name}\` — ${FIGMA_URL_BASE}/${ctx.fileKey}?node-id=${urlNodeId}`
      }),
    })
  }

  return findings
}
