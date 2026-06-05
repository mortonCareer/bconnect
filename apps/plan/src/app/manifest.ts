import type { MetadataRoute } from 'next'
import { SERVICE_NAME } from '@bconnect/config/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SERVICE_NAME,
    short_name: SERVICE_NAME,
    description: '시공·하도급 인력을 처음부터 끝까지 연결하는 서비스',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#386dff',
    lang: 'ko',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
