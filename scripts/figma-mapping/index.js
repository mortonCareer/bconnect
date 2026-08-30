#!/usr/bin/env node
/**
 * Figma 매핑 검사
 */

import { loadContext } from './context.js'
import { publishReport, printReportDryRun } from './report.js'
import { checkFigmaMapping } from './check-mapping.js'

/**
 * 검사 목록
 * @type {Array<(ctx: any) => Promise<import('./report.js').Result[]>>}
 */
const CHECKS = [checkFigmaMapping]

const isDryRun = process.argv.includes('--dry-run')

async function main() {
  console.log('Figma context 로드 중...')
  const ctx = await loadContext()
  console.log(
    `Figma context 로딩 완료 : @figma ${ctx.tags.length}개, 노드 ${ctx.nodes.size}개 확인`
  )

  /** @type {import('./report.js').Result[]} */
  const results = []
  for (const check of CHECKS) {
    console.log(`${check.name} 실행 중...`)
    const result = await check(ctx)
    results.push(...result)
    console.log(`${check.name} 완료 : ${result.length}건 발견`)
  }

  if (isDryRun) {
    printReportDryRun(results)
  } else {
    await publishReport(results)
  }
}

main().catch((err) => {
  console.error('에러가 발생했습니다 :', err)
  process.exit(1)
})
