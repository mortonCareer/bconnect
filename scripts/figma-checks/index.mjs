#!/usr/bin/env node
/**
 * Figma drift 검사 entry point.
 *
 * 환경 변수:
 * - FIGMA_ACCESS_TOKEN — Figma REST API 호출용 (필수)
 * - GITHUB_TOKEN       — issue 생성/갱신용 (필수, dry-run 제외)
 * - GITHUB_REPOSITORY  — owner/repo 형식 (GHA에서 자동 주입, 로컬은 default)
 *
 * 실행:
 *   node scripts/figma-checks/index.mjs            # 실제 issue 갱신
 *   node scripts/figma-checks/index.mjs --dry-run  # stdout만 (issue 조작 X)
 *
 * 새 체크 추가: 본 파일의 CHECKS 배열에 함수 추가만 하면 됨.
 */

import { loadFigmaContext } from './lib/figma-context.mjs'
import { publishReport, printReportDryRun } from './lib/report.mjs'
import { checkFigmaCoverage } from './check-figma-coverage.mjs'

/**
 * 모든 체크 함수 등록.
 * 각 함수는 ctx를 받아 Finding[]를 반환.
 * @type {Array<(ctx: any) => Promise<import('./lib/report.mjs').Finding[]>>}
 */
const CHECKS = [
  checkFigmaCoverage,
  // 추후 추가:
  // checkNamingConvention,    // #258
  // checkScaffoldIsolation,
]

const isDryRun = process.argv.includes('--dry-run')

async function main() {
  console.log('🔍 Figma context 로드 중...')
  const ctx = await loadFigmaContext()
  console.log(
    `  → 코드 @figma 태그 ${ctx.codeTags.length}개, Figma 노드 ${ctx.nodes.size}개 로드됨`
  )

  /** @type {import('./lib/report.mjs').Finding[]} */
  const allFindings = []
  for (const check of CHECKS) {
    const checkName = check.name || 'anonymous'
    console.log(`▶ ${checkName} 실행 중...`)
    const findings = await check(ctx)
    console.log(`  → ${findings.length}건 발견`)
    allFindings.push(...findings)
  }

  if (isDryRun) {
    printReportDryRun(allFindings)
  } else {
    await publishReport(allFindings)
  }
}

main().catch((err) => {
  console.error('❌ 실패:', err)
  process.exit(1)
})
