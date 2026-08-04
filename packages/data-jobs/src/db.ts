// 커넥션·적재

import postgres from 'postgres'

export type Sql = ReturnType<typeof postgres>
export type Db = Sql | postgres.TransactionSql
export type Row = Record<string, unknown>

const DATABASE_URL = process.env.DATABASE_URL

const BATCH_SIZE = 1_000

export function createDb(): Sql {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required')
  return postgres(DATABASE_URL, { max: 5 })
}

// 전체 교체
export async function replaceAll(
  db: Db,
  table: string,
  rows: Row[],
  batchSize = BATCH_SIZE
): Promise<number> {
  await db`DELETE FROM ${db(table)}`

  for (let i = 0; i < rows.length; i += batchSize) {
    await db`INSERT INTO ${db(table)} ${db(rows.slice(i, i + batchSize))}`
  }

  return rows.length
}

// 충돌 키 기준 upsert. SET 절은 행 키에서 생성하고 synced_at 을 항상 갱신
export async function upsertAll(
  db: Db,
  table: string,
  rows: Row[],
  conflictKey: string | string[],
  batchSize = BATCH_SIZE
): Promise<number> {
  if (rows.length === 0) return 0

  const keys = Array.isArray(conflictKey) ? conflictKey : [conflictKey]
  const updatable = Object.keys(rows[0]).filter((column) => !keys.includes(column))
  let affected = 0

  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize)
    const assignments = updatable
      .map((column) => db`${db(column)} = excluded.${db(column)}`)
      .reduce((left, right) => db`${left}, ${right}`)

    const result = await db`
      INSERT INTO ${db(table)} ${db(chunk)}
      ON CONFLICT (${db(keys)}) DO UPDATE SET ${assignments}, synced_at = now()
    `
    affected += result.count
  }

  return affected
}
