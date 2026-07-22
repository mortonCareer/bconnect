import { execFileSync } from 'node:child_process'
import postgres from 'postgres'

const PROJECT_ID = process.env.RAILWAY_PROJECT_ID ?? '90cd6d09-4c7b-415f-b13f-3d6b6051769a'
const ENVIRONMENT = process.env.RAILWAY_ENVIRONMENT ?? 'dev'

function fail(message, hint) {
  console.error(`\n  ✖ ${message}`)
  if (hint) console.error(`    ${hint}`)
  console.error()
  process.exit(1)
}

function parsePhone(input) {
  if (!input) {
    fail('전화번호를 넣어주세요.', '예: pnpm otp 01000000200')
  }
  const digits = input.replace(/\D/g, '')
  if (!/^01\d{8,9}$/.test(digits)) {
    fail(`전화번호 형식이 아닙니다: ${input}`, '예: 01000000200 또는 010-0000-0200')
  }
  return digits
}

function fetchDatabaseUrl() {
  let raw
  try {
    raw = execFileSync(
      'railway',
      ['variables', '-s', 'Postgres', '-p', PROJECT_ID, '-e', ENVIRONMENT, '--json'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    )
  } catch (error) {
    const stderr = String(error.stderr ?? '')
    if (error.code === 'ENOENT') {
      fail('railway CLI 가 없습니다.', 'npm i -g @railway/cli 로 설치하세요.')
    }
    if (/unauthor|not logged in|login/i.test(stderr)) {
      fail('railway 로그인이 필요합니다.', 'railway login 을 한 번 실행하세요.')
    }
    fail(
      'railway 에서 접속 정보를 못 가져왔습니다.',
      stderr.trim() || 'railway login 상태를 확인하세요.'
    )
  }

  let url
  try {
    url = JSON.parse(raw).DATABASE_PUBLIC_URL
  } catch {
    fail('railway 응답을 읽지 못했습니다.', raw.trim().slice(0, 200))
  }
  if (!url)
    fail('DATABASE_PUBLIC_URL 이 없습니다.', 'Postgres 서비스 이름이 바뀌었는지 확인하세요.')
  return url
}

function describe(row) {
  const remainingMs = new Date(row.expired_at).getTime() - Date.now()

  if (row.attempts >= 5) {
    return {
      ok: false,
      message: '5회 틀려서 잠겼습니다.',
      hint: '앱에서 인증번호를 다시 요청하면 풀립니다.',
    }
  }
  if (row.revoked) {
    return { ok: false, message: '이미 사용한 인증번호입니다.', hint: '앱에서 다시 요청하세요.' }
  }
  if (remainingMs <= 0) {
    return {
      ok: false,
      message: `만료됐습니다 (${row.code}).`,
      hint: '유효시간은 3분입니다. 앱에서 다시 요청하세요.',
    }
  }
  return { ok: true, remainingMs }
}

const phone = parsePhone(process.argv[2])
const sql = postgres(fetchDatabaseUrl(), { ssl: false, onnotice: () => {} })

try {
  const [row] = await sql`
    select code, expired_at, revoked, attempts
    from otps
    where phone = ${phone}
  `

  if (!row) {
    fail(
      `${phone} 로 요청된 인증번호가 없습니다.`,
      '앱 로그인 화면에서 인증번호를 먼저 요청하세요.'
    )
  }

  const status = describe(row)
  if (!status.ok) fail(status.message, status.hint)

  const seconds = Math.floor(status.remainingMs / 1000)
  console.log(`\n  🔑 ${row.code}   (남은 시간 ${Math.floor(seconds / 60)}분 ${seconds % 60}초)\n`)
} finally {
  await sql.end()
}
