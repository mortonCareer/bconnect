const GITHUB_TOKEN = process.env.GITHUB_TOKEN
// 저장소 : https://github.com/mortonCareer/bconnect
const REPOSITORY = 'mortonCareer/bconnect'
const ISSUE_LABEL = '🤖 figma-drift'
const ISSUE_TITLE = 'Figma 누락 · 불일치 항목 감지'

/**
 * @typedef {Object} Result
 * @property {'unmapped-node' | 'not-ready' | 'not-found'} checkName
 * @property {string} nodeId
 * @property {string} url - Figma URL
 * @property {string} [nodeName] - not-found 제외
 * @property {string} [file] - unmapped-node 제외
 * @property {string} [parentNode]
 */

const GH_API = 'https://api.github.com'

async function ghFetch(path, init = {}) {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN env var is required')
  const res = await fetch(`${GH_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} ${path}: ${await res.text()}`)
  }
  return res.json()
}

const nodeLink = (result) =>
  `[${result.nodeName ? `${result.nodeName}(${result.nodeId})` : result.nodeId}](${result.url})`

const fileLink = (result) =>
  `[${result.file.split('/').pop()}](<https://github.com/${REPOSITORY}/blob/HEAD/${result.file}>)`

/**
 * @param {Result[]} results
 * @returns {string}
 */
function buildMarkdown(results) {
  const unmappedNode = results.filter((it) => it.checkName === 'unmapped-node')
  const notReady = results.filter((it) => it.checkName === 'not-ready')
  const notFound = results.filter((it) => it.checkName === 'not-found')

  const lines = [
    '> `scripts/figma-mapping`가 생성한 이슈입니다',
    '',
    '## 요약',
    '',
    `- 매핑되지 않은 노드 ${unmappedNode.length}건`,
    `- 매핑되지 않은 컴포넌트 ${notReady.length + notFound.length}건`,
    `  - Ready for dev 아님 ${notReady.length}건`,
    `  - 노드를 찾을 수 없음 ${notFound.length}건`,
    '',
  ]

  // unmapped node
  if (unmappedNode.length > 0) {
    lines.push(`## 매핑되지 않은 노드 (${unmappedNode.length}건)`, '')
    lines.push('Ready for dev 상태이나 컴포넌트에 매핑되지 않은 노드입니다.', '')

    const byParentNode = new Map()
    for (const result of unmappedNode) {
      if (!byParentNode.has(result.parentNode)) byParentNode.set(result.parentNode, [])
      byParentNode.get(result.parentNode).push(result)
    }
    for (const [parentNode, items] of byParentNode) {
      lines.push(`### ${parentNode} (${items.length}건)`, '')
      for (const item of items) lines.push(`- ${nodeLink(item)}`)
      lines.push('')
    }
  }

  if (notReady.length + notFound.length > 0) {
    lines.push(`## 매핑되지 않은 컴포넌트 (${notReady.length + notFound.length}건)`, '')

    // not ready
    if (notReady.length > 0) {
      lines.push(`### Ready for dev 아님 (${notReady.length}건)`, '')
      lines.push('컴포넌트에 매핑된 노드가 Ready for dev가 아닙니다.', '')
      for (const item of notReady) lines.push(`- ${fileLink(item)} / ${nodeLink(item)}`)
      lines.push('')
    }

    // not found
    if (notFound.length > 0) {
      lines.push(`### 노드를 찾을 수 없음 (${notFound.length}건)`, '')
      lines.push('컴포넌트에 매핑된 노드를 찾을 수 없습니다.', '')
      for (const item of notFound) lines.push(`- ${fileLink(item)} / ${nodeLink(item)}`)
      lines.push('')
    }
  }

  lines.push('### 참고 문서')
  lines.push('- [docs/reference/figma-tag.md](docs/reference/figma-tag.md)')
  lines.push('- [docs/reference/figma-mapping.md](docs/reference/figma-mapping.md)')

  return lines.join('\n')
}

/**
 * 검사 결과를 GitHub issue로 게시
 * @async
 * @param {Result[]} results
 */
export async function publishReport(results) {
  if (results.length === 0) {
    console.log('감지된 항목 0건 — issue 미생성')
    return
  }

  console.log(`감지된 항목 ${results.length}건 — issue 생성`)
  const created = await ghFetch(`/repos/${REPOSITORY}/issues`, {
    method: 'POST',
    body: JSON.stringify({
      title: ISSUE_TITLE,
      body: buildMarkdown(results),
      labels: [ISSUE_LABEL, 'chore'],
    }),
  })
  console.log(`#${created.number}: ${created.html_url}`)
}

/**
 * 검사 결과를 studio에 출력
 * @param {Result[]} results
 */
export function printReportDryRun(results) {
  console.log(`=== Results (${results.length}) ===\n`)
  console.log(buildMarkdown(results))
}
