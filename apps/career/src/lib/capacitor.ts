import { Capacitor } from '@capacitor/core'

/**
 * 현재 Capacitor 네이티브 환경(iOS/Android)에서 실행 중인지 확인
 * 웹 브라우저에서는 false 반환
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * 현재 플랫폼 반환: 'ios' | 'android' | 'web'
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web'
}
