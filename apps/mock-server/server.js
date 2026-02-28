import { createServer } from 'http'

// =====================================================================
// Seed data arrays
// =====================================================================
const NAMES = [
  '김철수',
  '이영희',
  '박민수',
  '정수진',
  '최동욱',
  '한미영',
  '송재호',
  '윤서연',
  '강태현',
  '임지은',
]
const USERNAMES = [
  'kimcs',
  'leeyh',
  'parkms',
  'jungsj',
  'choidw',
  'hanmy',
  'songjh',
  'yoonsy',
  'kangth',
  'limje',
]
const ROLES = [
  'WORKER',
  'FOREMAN',
  'WORKER',
  'CONTRACTOR',
  'WORKER',
  'ARCHITECT',
  'WORKER',
  'FOREMAN',
  'WORKER',
  'WORKER',
]
const TRADES = [
  'DESIGN',
  'DEMOLITION',
  'ELECTRICAL',
  'PLUMBING',
  'MECHANICAL',
  'MASONRY',
  'CARPENTRY',
  'GLAZING',
  'WATERPROOFING',
  'PLASTERING',
  'INSULATION',
  'TILING',
  'GROUTING',
  'PAINTING',
  'WALLPAPER',
  'FILM_SHEET',
  'HARDWOOD',
  'VINYL',
  'SINK',
  'FURNITURE',
  'AIR_CONDITIONING',
  'HOISTING',
  'TRANSPORT',
  'CLEANING',
  'GENERAL_LABOR',
]
const CITIES = ['서울특별시', '경기도 수원시', '부산광역시', '대전광역시', '인천광역시']
const STATES = ['강남구', '영통구', '해운대구', '유성구', '남동구']
const COMPANIES = ['대림건설', '현대건설', '삼성물산', 'GS건설', '포스코건설']
const TASK_TITLES = [
  '아파트 신축공사',
  '오피스텔 리모델링',
  '상가 인테리어',
  '주택 증축공사',
  '빌딩 외벽 보수',
]
const EVENT_TITLES = [
  '1차 골조공사',
  '2차 마감공사',
  '설비 배관작업',
  '전기 배선작업',
  '도장 마감작업',
]

const POST_CONTENTS = [
  '오늘 현장 마무리 잘 됐습니다. 내일 타일작업 시작합니다.',
  '비가 와서 외부 작업은 중단하고 내부 마감 진행했습니다.',
  '배관 작업 완료했습니다. 누수 테스트 통과!',
  '전기 배선 1차 완료. 감리 확인 대기 중입니다.',
  '도배 작업 3층까지 완료. 내일 4-5층 진행 예정.',
  '에어컨 설치 완료했습니다. 시운전 이상 없습니다.',
  '타일 시공 중 자재 추가 필요합니다. 발주 요청드립니다.',
  '목공 작업 순조롭게 진행 중입니다. 일정 내 완료 가능합니다.',
  '방수 작업 2차 코팅까지 완료. 양생 기간 필요합니다.',
  '철거 작업 완료. 폐기물 반출 내일 오전 예정.',
  '도장 작업 프라이머 도포 완료. 건조 후 상도 진행합니다.',
  '싱크대 설치 완료했습니다. 배수 테스트 정상.',
  '유리 시공 완료. 실리콘 양생 24시간 필요합니다.',
  '단열재 시공 완료. 기밀 테스트 통과했습니다.',
  '현장 정리 및 청소 완료. 준공검사 준비 중입니다.',
]

const CHAT_TITLES = [
  '대림건설 현장 A',
  '현대건설 마감팀',
  '삼성물산 설비',
  'GS건설 인테리어',
  '포스코 외벽팀',
  '강남 오피스텔',
  '수원 아파트 3차',
  '부산 상가 리모델링',
  '대전 주택 증축',
  '인천 빌딩 보수',
  '서초 타일팀',
  '판교 전기팀',
  '분당 배관팀',
  '일산 도배팀',
  '평택 철거팀',
  '화성 목공팀',
  '용인 방수팀',
  '안양 도장팀',
  '성남 설치팀',
  '시흥 청소팀',
  '광명 골조팀',
  '하남 마감팀',
  '구리 설비팀',
  '남양주 인테리어',
  '파주 현장',
]

const MESSAGE_CONTENTS = [
  '안녕하세요, 내일 현장 몇 시에 출근하면 될까요?',
  '오전 8시까지 와주시면 됩니다.',
  '자재는 이미 현장에 도착해 있습니다.',
  '알겠습니다. 준비물 따로 챙길 것 있나요?',
  '안전모랑 안전화는 필수입니다.',
  '네, 알겠습니다. 감사합니다.',
  '오늘 작업 진행 상황 공유드립니다.',
  '3층까지 완료했고 내일 4층 진행합니다.',
  '일정대로 잘 진행되고 있네요.',
  '자재 추가 발주 필요한 부분이 있습니다.',
  '어떤 자재인가요? 수량도 알려주세요.',
  '타일 30박스 추가 필요합니다.',
  '발주 넣었습니다. 내일 오전 도착 예정입니다.',
  '감사합니다. 빠른 처리 감사드립니다.',
  '현장 사진 공유드립니다.',
  '잘 진행되고 있네요. 수고하셨습니다.',
  '감리 일정 확인해 주세요.',
  '다음 주 월요일 오전으로 잡혀있습니다.',
  '준공 검사 준비사항 공유합니다.',
  '서류 준비는 제가 하겠습니다.',
  '안전 교육 일정 안내드립니다.',
  '이번 주 금요일 오후 2시입니다.',
  '참석 인원 명단 보내주세요.',
  '오늘 중으로 보내드리겠습니다.',
  '날씨가 좋으니 외부 작업 진행합시다.',
  '네, 바로 준비하겠습니다.',
  '점심 식사 같이 하실까요?',
  '좋습니다. 12시에 현장 앞에서 만나요.',
  '작업 완료 보고드립니다.',
  '고생 많으셨습니다. 내일도 잘 부탁드립니다.',
]

// =====================================================================
// Data generation
// =====================================================================
const now = new Date()
const isoNow = now.toISOString()

function dateOffset(days) {
  return new Date(now.getTime() + days * 86400000).toISOString()
}

function dateOnly(days) {
  return new Date(now.getTime() + days * 86400000).toISOString().split('T')[0]
}

// Members (10)
const members = NAMES.map((name, i) => ({
  id: i + 1,
  username: USERNAMES[i],
  name,
  phone: `010${String(10000000 + i).slice(1)}`,
  picture: `https://picsum.photos/seed/${USERNAMES[i]}/200`,
  role: ROLES[i],
  createdAt: dateOffset(-30),
  modifiedAt: isoNow,
}))

// Profiles (10, id matches member index + 1)
const profiles = members.map((m, i) => ({
  id: i + 1,
  memberId: m.id,
  primaryTrade: TRADES[i % TRADES.length],
  trades: [TRADES[i % TRADES.length], TRADES[(i + 5) % TRADES.length]],
  experience: 2 + ((i * 3) % 20),
  headline: `${TRADES[i % TRADES.length]} 전문 기술자`,
  about: `${m.name}입니다. ${2 + ((i * 3) % 20)}년 경력의 숙련된 기술자입니다. 안전하고 꼼꼼한 시공을 약속드립니다.`,
  address: {
    zipcode: `${10000 + i * 1111}`,
    city: CITIES[i % CITIES.length],
    state: STATES[i % STATES.length],
    street: `건설로 ${(i + 1) * 10}`,
    detail: `${i + 1}층`,
    latitude: 37.5 + i * 0.01,
    longitude: 127.0 + i * 0.01,
  },
  createdAt: dateOffset(-30),
  modifiedAt: isoNow,
}))

// Tasks (5)
const tasks = COMPANIES.map((company, i) => ({
  id: i + 1,
  company,
  address: {
    zipcode: `${20000 + i * 1111}`,
    city: CITIES[i],
    state: STATES[i],
    street: `공사로 ${(i + 1) * 100}`,
    detail: null,
    latitude: 37.5 + i * 0.02,
    longitude: 127.0 + i * 0.02,
  },
  taskTitle: TASK_TITLES[i],
  eventTitle: EVENT_TITLES[i],
  trades: [TRADES[i * 2], TRADES[i * 2 + 1]],
  start: dateOnly(-30 + i * 10),
  end: dateOnly(30 + i * 10),
  createdAt: dateOffset(-30),
  modifiedAt: isoNow,
}))

// Posts (50)
const posts = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  authorId: (i % 10) + 1, // profile id = member id
  taskId: (i % 5) + 1,
  images: i % 3 === 0 ? [`https://picsum.photos/seed/post${i}/400/300`] : [],
  content: POST_CONTENTS[i % POST_CONTENTS.length],
  createdAt: dateOffset(-i * 0.5), // newest first
  modifiedAt: dateOffset(-i * 0.5),
}))

// Chats (25)
const chats = CHAT_TITLES.map((title, i) => {
  const participantIds = [1, (i % 9) + 2] // always includes current user (1)
  return {
    id: i + 1,
    title,
    participantIds,
    lastMessage: {
      id: i * 50 + 1,
      chatId: i + 1,
      senderId: participantIds[i % 2],
      content: MESSAGE_CONTENTS[i % MESSAGE_CONTENTS.length],
      createdAt: dateOffset(-i * 0.3),
      modifiedAt: dateOffset(-i * 0.3),
    },
    unreadCount: i % 4 === 0 ? 0 : (i % 7) + 1,
    createdAt: dateOffset(-60),
    modifiedAt: dateOffset(-i * 0.3),
  }
})

// Messages (per chat, 40-50)
const allMessages = new Map()
for (const chat of chats) {
  const count = 40 + (chat.id % 11)
  const msgs = Array.from({ length: count }, (_, j) => ({
    id: chat.id * 1000 + j + 1,
    chatId: chat.id,
    senderId: chat.participantIds[j % 2],
    content: MESSAGE_CONTENTS[j % MESSAGE_CONTENTS.length],
    createdAt: dateOffset(-count + j), // oldest first by id
    modifiedAt: dateOffset(-count + j),
  }))
  allMessages.set(chat.id, msgs)
}

// =====================================================================
// Helpers
// =====================================================================
const json = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ success: true, data }))
}

const jsonError = (res, status, code, message) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ success: false, error: { code, message } }))
}

const parseBody = (req) =>
  new Promise((resolve) => {
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

const parseCookies = (cookieHeader) => {
  const cookies = {}
  if (cookieHeader) {
    cookieHeader.split(';').forEach((c) => {
      const [name, value] = c.trim().split('=')
      cookies[name] = value
    })
  }
  return cookies
}

const parseUrl = (rawUrl) => {
  const [pathname, search] = rawUrl.split('?')
  const params = new URLSearchParams(search || '')
  return { pathname, params }
}

// Route pattern matching: /api/v1/members/:id → extracts id
const match = (pattern, pathname) => {
  const patternParts = pattern.split('/')
  const pathParts = pathname.split('/')
  if (patternParts.length !== pathParts.length) return null
  const params = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i]
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

// Cursor pagination helper (forward)
function paginate(items, cursor, limit = 20) {
  let startIdx = 0
  if (cursor) {
    const cursorId = parseInt(cursor)
    startIdx = items.findIndex((item) => item.id === cursorId)
    if (startIdx === -1) startIdx = 0
  }
  const page = items.slice(startIdx, startIdx + limit)
  const hasMore = startIdx + limit < items.length
  const nextCursor = hasMore ? String(items[startIdx + limit].id) : null
  return { items: page, meta: { nextCursor, hasMore } }
}

// Reverse cursor pagination (for messages — fetch items BEFORE cursor)
function paginateReverse(items, before, limit = 30) {
  // items are sorted by id ascending (oldest first)
  let endIdx = items.length
  if (before) {
    const beforeId = parseInt(before)
    endIdx = items.findIndex((item) => item.id === beforeId)
    if (endIdx === -1) endIdx = items.length
  }
  const startIdx = Math.max(0, endIdx - limit)
  const page = items.slice(startIdx, endIdx)
  const hasMore = startIdx > 0
  const nextCursor = hasMore ? String(items[startIdx].id) : null
  return { items: page, meta: { nextCursor, hasMore } }
}

// =====================================================================
// Verification codes (for auth)
// =====================================================================
const verificationCodes = new Map()
const generateToken = (userId) => `mock_token_${userId}_${Date.now()}`

// =====================================================================
// Server
// =====================================================================
const server = createServer(async (req, res) => {
  // CORS
  const origin = req.headers.origin
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const { pathname, params: query } = parseUrl(req.url)
  const method = req.method

  // =====================
  // Auth
  // =====================
  if (pathname === '/api/v1/auth/otp/send' && method === 'POST') {
    const body = await parseBody(req)
    if (!body.phone) return jsonError(res, 400, 'C001', '유효하지 않은 입력값입니다')
    verificationCodes.set(body.phone, '123456')
    console.log(`[Auth] OTP sent to ${body.phone}: 123456`)
    return json(res, 200, { expiresAt: new Date(Date.now() + 180000).toISOString() })
  }

  if (pathname === '/api/v1/auth/otp/verify' && method === 'POST') {
    const body = await parseBody(req)
    if (!body.phone || !body.code) return jsonError(res, 400, 'C001', '유효하지 않은 입력값입니다')
    const stored = verificationCodes.get(body.phone)
    if (stored !== body.code) return jsonError(res, 400, 'A003', '유효하지 않은 인증번호입니다')
    verificationCodes.delete(body.phone)

    // 01099로 시작하는 번호 → 신규유저 (회원가입 플로우)
    if (body.phone.startsWith('01099')) {
      return json(res, 200, { registered: false, signupToken: `signup_${Date.now()}` })
    }
    // 그 외 → 기존유저 (members[0]으로 로그인)
    const user = members.find((m) => m.phone === body.phone) || members[0]
    const accessToken = generateToken(user.id)
    const refreshToken = generateToken(user.id) + '_refresh'
    res.setHeader(
      'Set-Cookie',
      `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`
    )
    return json(res, 200, { registered: true, accessToken, refreshToken })
  }

  if (pathname === '/api/v1/auth/refresh' && method === 'POST') {
    const cookies = parseCookies(req.headers.cookie)
    if (!cookies.refreshToken)
      return jsonError(res, 401, 'A006', '유효하지 않은 리프레시 토큰입니다')
    return json(res, 200, { accessToken: generateToken(1) })
  }

  if (pathname === '/api/v1/auth/logout' && method === 'POST') {
    res.setHeader('Set-Cookie', 'refreshToken=; HttpOnly; Path=/; Max-Age=0')
    return json(res, 200, null)
  }

  if (pathname === '/api/v1/auth/me' && method === 'GET') {
    return json(res, 200, members[0])
  }

  // =====================
  // Members
  // =====================
  if (pathname === '/api/v1/members' && method === 'GET') {
    return json(res, 200, members)
  }

  if (pathname === '/api/v1/members' && method === 'POST') {
    const body = await parseBody(req)
    const newMember = { id: members.length + 1, ...body, createdAt: isoNow, modifiedAt: isoNow }
    members.push(newMember)
    return json(res, 200, newMember)
  }

  {
    const m = match('/api/v1/members/:id', pathname)
    if (m && method === 'GET') {
      const member = members.find((x) => x.id === parseInt(m.id))
      if (!member) return jsonError(res, 404, 'NOT_FOUND', '회원을 찾을 수 없습니다')
      return json(res, 200, member)
    }
    if (m && method === 'PUT') {
      const member = members.find((x) => x.id === parseInt(m.id))
      if (!member) return jsonError(res, 404, 'NOT_FOUND', '회원을 찾을 수 없습니다')
      const body = await parseBody(req)
      Object.assign(member, body, { modifiedAt: new Date().toISOString() })
      return json(res, 200, member)
    }
  }

  // =====================
  // Profiles
  // =====================
  if (pathname === '/api/v1/profiles/me' && method === 'GET') {
    return json(res, 200, profiles[0])
  }

  if (pathname === '/api/v1/profiles/me' && method === 'PUT') {
    const body = await parseBody(req)
    Object.assign(profiles[0], body, { modifiedAt: new Date().toISOString() })
    res.writeHead(204)
    res.end()
    return
  }

  {
    const m = match('/api/v1/profiles/:id', pathname)
    if (m && method === 'GET') {
      const profile = profiles.find((x) => x.id === parseInt(m.id))
      if (!profile) return jsonError(res, 404, 'NOT_FOUND', '프로필을 찾을 수 없습니다')
      return json(res, 200, profile)
    }
  }

  // =====================
  // Posts (cursor pagination + filters)
  // =====================
  if (pathname === '/api/v1/posts' && method === 'GET') {
    let filtered = [...posts]

    const authorId = query.get('authorId')
    if (authorId) filtered = filtered.filter((p) => p.authorId === parseInt(authorId))

    const taskId = query.get('taskId')
    if (taskId) filtered = filtered.filter((p) => p.taskId === parseInt(taskId))

    const trade = query.get('trade')
    if (trade) {
      // Filter by author's primary trade
      const matchingProfileIds = profiles.filter((p) => p.primaryTrade === trade).map((p) => p.id)
      filtered = filtered.filter((p) => matchingProfileIds.includes(p.authorId))
    }

    const minExp = query.get('minExperience')
    if (minExp) {
      const ids = profiles.filter((p) => p.experience >= parseInt(minExp)).map((p) => p.id)
      filtered = filtered.filter((p) => ids.includes(p.authorId))
    }

    const maxExp = query.get('maxExperience')
    if (maxExp) {
      const ids = profiles.filter((p) => p.experience <= parseInt(maxExp)).map((p) => p.id)
      filtered = filtered.filter((p) => ids.includes(p.authorId))
    }

    const cursor = query.get('cursor')
    const limit = parseInt(query.get('limit')) || 20
    return json(res, 200, paginate(filtered, cursor, limit))
  }

  {
    const m = match('/api/v1/posts/:id', pathname)
    if (m && method === 'GET') {
      const post = posts.find((x) => x.id === parseInt(m.id))
      if (!post) return jsonError(res, 404, 'NOT_FOUND', '게시글을 찾을 수 없습니다')
      return json(res, 200, post)
    }
  }

  // =====================
  // Tasks
  // =====================
  if (pathname === '/api/v1/tasks' && method === 'GET') {
    return json(res, 200, tasks)
  }

  {
    const m = match('/api/v1/tasks/:id', pathname)
    if (m && method === 'GET') {
      const task = tasks.find((x) => x.id === parseInt(m.id))
      if (!task) return jsonError(res, 404, 'NOT_FOUND', '작업을 찾을 수 없습니다')
      return json(res, 200, task)
    }
  }

  // =====================
  // Chats (cursor pagination)
  // =====================
  if (pathname === '/api/v1/chats' && method === 'GET') {
    const cursor = query.get('cursor')
    const limit = parseInt(query.get('limit')) || 20
    return json(res, 200, paginate(chats, cursor, limit))
  }

  {
    const m = match('/api/v1/chats/:id', pathname)
    if (m) {
      const chatId = parseInt(m.id)

      // GET /api/v1/chats/:id/messages
      if (pathname.endsWith('/messages') && method === 'GET') {
        const actualChatId = parseInt(pathname.split('/')[4])
        const msgs = allMessages.get(actualChatId) || []
        const before = query.get('before')
        const limit = parseInt(query.get('limit')) || 30
        return json(res, 200, paginateReverse(msgs, before, limit))
      }

      // GET /api/v1/chats/:id
      if (method === 'GET') {
        const chat = chats.find((x) => x.id === chatId)
        if (!chat) return jsonError(res, 404, 'NOT_FOUND', '채팅방을 찾을 수 없습니다')
        return json(res, 200, chat)
      }
    }
  }

  // Handle /api/v1/chats/:id/messages explicitly (match helper doesn't handle nested)
  {
    const msgMatch = match('/api/v1/chats/:chatId/messages', pathname)
    if (msgMatch && method === 'GET') {
      const chatId = parseInt(msgMatch.chatId)
      const msgs = allMessages.get(chatId) || []
      const before = query.get('before')
      const limit = parseInt(query.get('limit')) || 30
      return json(res, 200, paginateReverse(msgs, before, limit))
    }
  }

  // =====================
  // 404
  // =====================
  jsonError(res, 404, 'NOT_FOUND', 'Not found')
})

const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`)
  console.log(`  Members: ${members.length}`)
  console.log(`  Profiles: ${profiles.length}`)
  console.log(`  Tasks: ${tasks.length}`)
  console.log(`  Posts: ${posts.length}`)
  console.log(`  Chats: ${chats.length}`)
  console.log(`  Messages per chat: 40-50`)
  console.log()
  console.log('Auth: POST /api/v1/auth/otp/send { "phone": "01012345678" }')
  console.log('      POST /api/v1/auth/otp/verify { "phone": "01012345678", "code": "123456" }')
})
