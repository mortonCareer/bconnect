import type { MetadataRoute } from 'next'
import { SITE_URL } from '@bconnect/config/site'
import { IS_PRODUCTION_DEPLOY } from '@bconnect/config/seo'

export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION_DEPLOY) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${SITE_URL.landing}/sitemap.xml`,
  }
}
