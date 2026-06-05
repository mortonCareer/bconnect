import type { MetadataRoute } from 'next'
import { SITE_URL } from '@bconnect/config/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.career
  return [
    {
      url: base,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${base}/one-click`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]
}
