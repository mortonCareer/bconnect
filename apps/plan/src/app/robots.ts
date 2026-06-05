import type { MetadataRoute } from 'next'
import { SITE_URL } from '@bconnect/config/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/login', '/signup', '/api/'],
    },
    sitemap: `${SITE_URL.plan}/sitemap.xml`,
  }
}
