'use client'

import { initializeApp, getApp, type FirebaseApp, FirebaseError } from 'firebase/app'
import { getMessaging, type Messaging, isSupported } from 'firebase/messaging'

/**
 * Firebase 앱 인스턴스를 지연 초기화 (SSR 안전)
 * config가 없으면 undefined 반환 (로컬 개발 등)
 *
 * NOTE: process.env.NEXT_PUBLIC_* 를 직접 접근해야 Next.js 빌드 타임에 인라인됨.
 * `env` 객체 경유하면 동적 property lookup 이 되어 브라우저 번들에서 undefined.
 */
let app: FirebaseApp | undefined

function getFirebaseApp(): FirebaseApp | undefined {
  if (typeof window === 'undefined') return undefined
  if (app) return app

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

  // 필수 config 누락 시 초기화하지 않음 (로컬 개발 허용)
  if (!apiKey || !authDomain || !projectId || !messagingSenderId || !appId) {
    console.warn('[FCM] env 누락:', {
      apiKey: !!apiKey,
      authDomain: !!authDomain,
      projectId: !!projectId,
      messagingSenderId: !!messagingSenderId,
      appId: !!appId,
    })
    return undefined
  }

  // 기본 앱이 이미 초기화돼 있으면 재사용 (HMR 등으로 이 모듈이 재평가될 때 중복 초기화 방지)
  app =
    getDefaultAppOrUndefined() ??
    initializeApp({
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    })

  return app
}

// Firebase JS SDK 는 기본 앱이 없으면 getApp() 이 throw 함.
// getApps()[0] 대신 이름으로 안전하게 조회하되, 없으면 undefined 반환.
function getDefaultAppOrUndefined(): FirebaseApp | undefined {
  try {
    return getApp()
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'app/no-app') {
      return undefined
    }
    throw error
  }
}

/**
 * FCM Messaging 인스턴스 반환
 * - 브라우저가 FCM을 지원하지 않거나 config가 없으면 null
 * - iOS Safari 16.4 미만 등에서는 null 반환됨
 */
export async function getFcmMessaging(): Promise<Messaging | null> {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) {
    console.warn('[FCM] Firebase 앱 초기화 실패 (env 누락)')
    return null
  }

  const supported = await isSupported()
  if (!supported) {
    console.warn('[FCM] 브라우저 FCM 미지원 (isSupported=false)')
    return null
  }

  return getMessaging(firebaseApp)
}
