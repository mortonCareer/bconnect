import { createServer } from 'http'

const users = [
  { id: 1, phone: '+821012345678', username: 'kim', name: '김철수', picture: null, role: 'USER' },
  { id: 2, phone: '+821087654321', username: 'lee', name: '이영희', picture: null, role: 'USER' },
  { id: 3, phone: '+821011112222', username: 'park', name: '박민수', picture: null, role: 'ADMIN' },
]

// 인증 코드 저장소 (phone -> code)
const verificationCodes = new Map()

// JWT 토큰 생성 (간단한 mock)
const generateToken = (userId) => {
  return `mock_token_${userId}_${Date.now()}`
}

// 쿠키 파싱
const parseCookies = (cookieHeader) => {
  const cookies = {}
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const [name, value] = cookie.trim().split('=')
      cookies[name] = value
    })
  }
  return cookies
}

// 요청 바디 파싱
const parseBody = (req) => {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
  })
}

const server = createServer(async (req, res) => {
  // CORS 설정
  const origin = req.headers.origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = req.url
  const method = req.method

  // =====================
  // Auth Endpoints
  // =====================

  // POST /api/v1/auth/send-code
  if (url === '/api/v1/auth/send-code' && method === 'POST') {
    const body = await parseBody(req)
    const { phone } = body

    if (!phone) {
      res.writeHead(400)
      res.end(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'Phone is required' },
        })
      )
      return
    }

    // 항상 123456 코드 발급 (개발용)
    const code = '123456'
    verificationCodes.set(phone, code)

    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString() // 3분 후 만료

    console.log(`[Auth] Verification code sent to ${phone}: ${code}`)

    res.writeHead(200)
    res.end(JSON.stringify({ success: true, data: { expiresAt } }))
    return
  }

  // POST /api/v1/auth/verify-code
  if (url === '/api/v1/auth/verify-code' && method === 'POST') {
    const body = await parseBody(req)
    const { phone, code } = body

    if (!phone || !code) {
      res.writeHead(400)
      res.end(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'Phone and code are required' },
        })
      )
      return
    }

    const storedCode = verificationCodes.get(phone)

    if (storedCode !== code) {
      res.writeHead(401)
      res.end(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_CODE', message: 'Invalid verification code' },
        })
      )
      return
    }

    // 코드 사용 후 삭제
    verificationCodes.delete(phone)

    // 사용자 찾기 또는 생성
    let user = users.find((u) => u.phone === phone)
    if (!user) {
      user = {
        id: users.length + 1,
        phone,
        username: null,
        name: null,
        picture: null,
        role: 'USER',
      }
      users.push(user)
    }

    const accessToken = generateToken(user.id)
    const refreshToken = generateToken(user.id) + '_refresh'

    // Refresh token을 httpOnly 쿠키로 설정
    res.setHeader(
      'Set-Cookie',
      `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`
    )

    console.log(`[Auth] User logged in: ${phone}`)

    res.writeHead(200)
    res.end(JSON.stringify({ success: true, data: { accessToken, user } }))
    return
  }

  // POST /api/v1/auth/refresh
  if (url === '/api/v1/auth/refresh' && method === 'POST') {
    const cookies = parseCookies(req.headers.cookie)
    const refreshToken = cookies.refreshToken

    if (!refreshToken) {
      res.writeHead(401)
      res.end(
        JSON.stringify({
          success: false,
          error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token not found' },
        })
      )
      return
    }

    // Mock: refreshToken에서 userId 추출 (실제로는 검증 필요)
    const accessToken = generateToken(1)

    res.writeHead(200)
    res.end(JSON.stringify({ success: true, data: { accessToken } }))
    return
  }

  // POST /api/v1/auth/logout
  if (url === '/api/v1/auth/logout' && method === 'POST') {
    // 쿠키 삭제
    res.setHeader('Set-Cookie', 'refreshToken=; HttpOnly; Path=/; Max-Age=0')

    console.log('[Auth] User logged out')

    res.writeHead(200)
    res.end(JSON.stringify({ success: true, data: null }))
    return
  }

  // GET /api/v1/auth/me
  if (url === '/api/v1/auth/me' && method === 'GET') {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401)
      res.end(
        JSON.stringify({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        })
      )
      return
    }

    // Mock: 첫 번째 사용자 반환 (실제로는 토큰에서 userId 추출)
    const user = users[0]

    res.writeHead(200)
    res.end(JSON.stringify({ success: true, data: user }))
    return
  }

  // =====================
  // User Endpoints
  // =====================

  if (url === '/api/v1/users' && method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({ success: true, data: users }))
    return
  }

  res.writeHead(404)
  res.end(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } }))
})

server.listen(8080, () => {
  console.log('Mock server running on http://localhost:8080')
  console.log('Auth test: POST /api/v1/auth/send-code with { "phone": "+821012345678" }')
  console.log(
    'Then: POST /api/v1/auth/verify-code with { "phone": "+821012345678", "code": "123456" }'
  )
})
