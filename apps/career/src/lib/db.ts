import 'server-only'

import postgres from 'postgres'

let _sql: ReturnType<typeof postgres> | null = null

export function getDb() {
  if (!_sql) {
    const url = process.env.RAILWAY_DATABASE_URL
    if (!url) {
      throw new Error('RAILWAY_DATABASE_URL is not configured')
    }
    _sql = postgres(url, {
      max: 3,
      idle_timeout: 10,
      max_lifetime: 60 * 5,
      connection: {
        application_name: 'morton-career',
      },
    })
  }
  return _sql
}
