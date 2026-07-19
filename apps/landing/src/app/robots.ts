import type { MetadataRoute } from 'next'
import { SITE_URL } from '@bconnect/config/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${SITE_URL.landing}/sitemap.xml`,
  }
}
