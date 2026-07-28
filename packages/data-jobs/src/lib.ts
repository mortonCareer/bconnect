import postgres from 'postgres'

type Sql = ReturnType<typeof postgres>

const DATABASE_URL = process.env.DATABASE_URL
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

// DB 커넥션
export function createDb(): Sql {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required')
  return postgres(DATABASE_URL, { max: 5 })
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// 배치 INSERT
export async function insertBatched(
  sql: Sql | postgres.TransactionSql,
  table: string,
  rows: Record<string, unknown>[],
  batchSize = 1000
): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    await sql`INSERT INTO ${sql(table)} ${sql(rows.slice(i, i + batchSize))}`
  }
}

// 슬랙 알림
export async function notifySlack(message: string): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })
  } catch (e) {
    console.error('[slack] notification failed:', e)
  }
}

// 공통 처리
export function runSync(name: string, sql: Sql, main: () => Promise<void>): void {
  console.log(`[${name}] 시작: ${new Date().toISOString()}`)
  main()
    .then(() => sql.end({ timeout: 5 }))
    .catch(async (err) => {
      console.error(`[${name}] 실패:`, err)
      await notifySlack(`🚨 *${name} 실패*\n${err instanceof Error ? err.message : String(err)}`)
      await sql.end()
      process.exit(1)
    })
}
