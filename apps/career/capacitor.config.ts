import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'so.morton.career',
  appName: '품앗이',
  webDir: 'out',
  server: {
    // Phase 1: 프로덕션 URL을 WebView에서 직접 로드
    // Phase 2: 서버 로직 BE 이전 후 static export(로컬 번들)로 전환 예정
    url: process.env.CAPACITOR_SERVER_URL || 'https://career.morton.so',
    // 개발 중에는 localhost 사용: CAPACITOR_SERVER_URL=http://localhost:3000
  },
}

export default config
