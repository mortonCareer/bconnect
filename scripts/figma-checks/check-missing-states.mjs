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
 * - "회원가입/auth - OTP 입력" → "회원가입/auth"
 * - "프로필 - 동료" → "프로필 - 동료" (delimiter 없음 = standalone)
 *
 * 휴리스틱: 마지막 " (" 또는 " - " 기준으로 분할 → 앞부분이 prefix
 *
 * @param {string} name
 * @returns {string}
 */
function extractBasePrefix(name) {
  // " (" 우선 (괄호로 변형 표현)
  const parenIdx = name.lastIndexOf(' (')
  if (parenIdx > 0 && name.endsWith(')')) {
    return name.slice(0, parenIdx)
  }
  // " - " (대시로 상태 표현)
  const dashIdx = name.lastIndexOf(' - ')
  if (dashIdx > 0) {
    return name.slice(0, dashIdx)
  }
  // delimiter 없음 = 자기 자신이 base
  return name
}

/**
 * @param {import('./lib/figma-context.mjs').FigmaContext} ctx
 * @returns {Promise<import('./lib/report.mjs').Finding[]>}
 */
export async function checkMissingStates(ctx) {
  const findings = []

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

    // 코드의 state 노드 + primary 노드 합쳐서 매핑된 노드 IDs
    const mappedNodeIds = new Set([tag.primaryNodeId, ...tag.states.map((s) => s.nodeId)])

    // 매핑 안 된 sibling 찾기
    const missing = siblings.filter((s) => !mappedNodeIds.has(s.id))
    if (missing.length === 0) continue

    findings.push({
      checkName: 'missing-states',
      severity: 'warning',
      file: tag.file,
      message: `Figma에 "${basePrefix}" 계열 frame이 ${siblings.length}개 있는데 코드는 ${mappedNodeIds.size}개만 매핑 (누락 ${missing.length}개)`,
      links: missing.map((m) => {
        const urlNodeId = m.id.replace(':', '-')
        return `\`${m.name}\` — ${FIGMA_URL_BASE}/${ctx.fileKey}?node-id=${urlNodeId}`
      }),
    })
  }

  return findings
}
