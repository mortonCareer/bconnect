import type { MetadataRoute } from 'next'
import { SITE_URL } from '@bconnect/config/site'
import { IS_PRODUCTION_DEPLOY } from '@bconnect/config/deploy-env'

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
      disallow: ['/signup', '/instagram', '/api/'],
    },
    sitemap: `${SITE_URL.career}/sitemap.xml`,
  }
}
