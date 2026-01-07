import { createServer } from 'http'

const users = [
  { id: 1, username: 'kim', name: '김철수' },
  { id: 2, username: 'lee', name: '이영희' },
  { id: 3, username: 'park', name: '박민수' },
]

const server = createServer((req, res) => {
  // 요청한 origin 그대로 허용 (3000, 3001 둘 다)
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

  if (req.url === '/api/v1/users' && req.method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({ success: true, data: users }))
    return
  }

  res.writeHead(404)
  res.end(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } }))
})

server.listen(8080, () => {
  console.log('Mock server running on http://localhost:8080')
})
