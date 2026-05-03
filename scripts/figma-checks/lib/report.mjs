/**
 * Figma drift 검사 결과를 단일 누적 GitHub issue로 보고.
 *
 * - 동일한 라벨이 붙은 기존 issue가 있으면 body 갱신
 * - 없으면 새로 생성
 * - drift가 0건이면 (있던) 기존 issue를 닫음
 *
 * GitHub REST API + GITHUB_TOKEN 사용 (gh CLI 의존 없음 → 로컬 테스트도 동일 코드).
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const REPO = process.env.GITHUB_REPOSITORY ?? 'mortonCareer/bconnect'
const ISSUE_LABEL = '🤖 figma-drift'
const ISSUE_TITLE = '🔍 Figma drift 자동 감지 — 누락/불일치 항목'

/**
 * @typedef {Object} Finding
 * @property {string} checkName - 체크 이름 (e.g. "missing-states")
 * @property {'error' | 'warning' | 'info'} severity
 * @property {string} file - 코드 파일 경로
 * @property {string} message - 사람이 읽는 메시지
 * @property {string[]} [links] - Figma URL 등 참고 링크
 */

const GH_API = 'https://api.github.com'

async function ghFetch(path, init = {}) {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN env var is required')
  const res = await fetch(`${GH_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} ${path}: ${await res.text()}`)
  }
  return res.json()
}

async function findExistingIssue() {
  const q = encodeURIComponent(`repo:${REPO} is:issue is:open label:"${ISSUE_LABEL}"`)
  const result = await ghFetch(`/search/issues?q=${q}`)
  return result.items?.[0] ?? null
}

/**
 * @param {Finding[]} findings
 * @returns {string}
 */
function buildMarkdown(findings) {
  const now = new Date().toISOString()
  const byCheck = new Map()
  for (const f of findings) {
    if (!byCheck.has(f.checkName)) byCheck.set(f.checkName, [])
    byCheck.get(f.checkName).push(f)
  }

  const lines = [
    '> 자동 생성 이슈 — `scripts/figma-checks/`가 매주 또는 수동 트리거 시 갱신합니다.',
    `> Last update: ${now} (UTC)`,
    `> 총 ${findings.length}건 발견`,
    '',
    '## 검사별 결과',
    '',
  ]

  for (const [check, items] of byCheck) {
    lines.push(`### ${check} (${items.length}건)`)
    lines.push('')
    // 파일별 그룹
    const byFile = new Map()
    for (const item of items) {
      if (!byFile.has(item.file)) byFile.set(item.file, [])
      byFile.get(item.file).push(item)
    }
    for (const [file, fileItems] of byFile) {
      lines.push(`- **\`${file}\`**`)
      for (const item of fileItems) {
        const sev = item.severity === 'error' ? '❌' : item.severity === 'warning' ? '⚠️' : 'ℹ️'
        lines.push(`  - ${sev} ${item.message}`)
        for (const link of item.links ?? []) {
          lines.push(`    - ${link}`)
        }
      }
    }
    lines.push('')
  }

  lines.push('---')
  lines.push('')
  lines.push('## 처리 방법')
  lines.push('')
  lines.push('1. 각 항목의 코드 파일 열기')
  lines.push(
    '2. 누락된 `@figma-state <name> <url>` 라인을 [figma-mapping 스킬](.claude/skills/figma-mapping/SKILL.md) 형식으로 추가'
  )
  lines.push('3. PR 머지 후 본 이슈는 다음 검사 사이클에서 자동 갱신/닫힘')
  lines.push('')
  lines.push(
    '컨벤션 변경이 필요한 경우 → [#258 frame naming convention](https://github.com/mortonCareer/bconnect/issues/258)'
  )

  return lines.join('\n')
}

/**
 * 검사 결과를 issue로 publish.
 * @param {Finding[]} findings
 */
export async function publishReport(findings) {
  const existing = await findExistingIssue()

  if (findings.length === 0) {
    if (existing) {
      console.log(`✓ Drift 0건 — 기존 issue #${existing.number} 닫음`)
      await ghFetch(`/repos/${REPO}/issues/${existing.number}`, {
        method: 'PATCH',
        body: JSON.stringify({
          state: 'closed',
          state_reason: 'completed',
        }),
      })
      await ghFetch(`/repos/${REPO}/issues/${existing.number}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          body: `Figma drift 0건 감지 (${new Date().toISOString()}) — 자동 close.`,
        }),
      })
    } else {
      console.log('✓ Drift 0건 — 신규 issue 생성 안 함')
    }
    return
  }

  const body = buildMarkdown(findings)

  if (existing) {
    console.log(`✓ Drift ${findings.length}건 — 기존 issue #${existing.number} 갱신`)
    await ghFetch(`/repos/${REPO}/issues/${existing.number}`, {
      method: 'PATCH',
      body: JSON.stringify({ body, title: ISSUE_TITLE }),
    })
  } else {
    console.log(`✓ Drift ${findings.length}건 — 신규 issue 생성`)
    const created = await ghFetch(`/repos/${REPO}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title: ISSUE_TITLE,
        body,
        labels: [ISSUE_LABEL, '🔧 chore'],
      }),
    })
    console.log(`  → #${created.number}: ${created.html_url}`)
  }
}

/**
 * Dry-run: stdout으로 markdown만 출력, issue 조작 안 함
 * @param {Finding[]} findings
 */
export function printReportDryRun(findings) {
  console.log(`=== Findings (${findings.length}) ===\n`)
  console.log(buildMarkdown(findings))
}
