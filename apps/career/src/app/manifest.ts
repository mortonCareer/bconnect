import type { MetadataRoute } from 'next'
import { SERVICE_NAME } from '@bconnect/config/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SERVICE_NAME,
    short_name: SERVICE_NAME,
    description: '기술자가 작업물을 올리고 일감을 받는 서비스',
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
