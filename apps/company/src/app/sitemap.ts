import type { MetadataRoute } from 'next'
import { SITE_URL } from '@bconnect/config/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.landing
  return [
    {
      url: base,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/career`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${base}/one-click`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]
}
