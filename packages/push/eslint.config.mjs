import config from '@bconnect/config/eslint/base'

const pushConfig = [
  ...config,
  {
    // SW 템플릿은 Service Worker 컨텍스트 코드(importScripts/firebase/self) — 텍스트로 읽혀
    // 서빙될 뿐 모듈로 빌드되지 않으므로 린트 대상에서 제외.
    ignores: ['src/firebase-messaging.sw.template.js'],
  },
]

export default pushConfig
