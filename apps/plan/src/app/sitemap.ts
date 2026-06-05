import type { MetadataRoute } from 'next'
import { SITE_URL } from '@bconnect/config/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL.plan,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
