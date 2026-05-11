/**
 * FCM 푸시 알림 테스트 스크립트
 *
 * 사용법:
 *   1. Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성
 *   2. 다운받은 JSON을 apps/career/.secrets/firebase-admin.json 으로 저장 (gitignore)
 *   3. 로컬에서 앱 실행 후 DevTools Console에서 [FCM] 디바이스 토큰 복사
 *   4. pnpm tsx apps/career/scripts/test-push.ts <TOKEN>
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// ESM/CJS 모두 호환: import.meta.url 은 tsx 가 ESM 모드로 실행해도 동작
const SERVICE_ACCOUNT_PATH = fileURLToPath(
  new URL('../.secrets/firebase-admin.json', import.meta.url)
)

async function main() {
  const token = process.argv[2]
  if (!token) {
    console.error('Usage: tsx test-push.ts <FCM_TOKEN>')
    process.exit(1)
  }

  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'))

  initializeApp({ credential: cert(serviceAccount) })

  const response = await getMessaging().send({
    token,
    notification: {
      title: '테스트 알림',
      body: '로컬에서 보낸 푸시입니다',
    },
    data: {
      // 딥링크: SW/포그라운드 훅 공통 규격 (apps/career/src/service-workers/firebase-messaging.sw.template.js 참조)
      url: '/messages/123',
    },
  })

  console.log('전송 성공:', response)
}

main().catch((err) => {
  console.error('전송 실패:', err)
  process.exit(1)
})
