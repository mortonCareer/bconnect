import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'so.morton.career',
  appName: 'Morton Career',
  webDir: 'out',
  server: {
    // 프로덕션에서는 로컬 번들을 사용하고,
    // 개발 중에는 Next.js dev server를 사용
    ...(process.env.NODE_ENV === 'development' && {
      url: 'http://localhost:3000',
      cleartext: true,
    }),
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
