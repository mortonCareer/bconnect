import { IS_PRODUCTION_DEPLOY } from '../deploy-env'

export function noindexHeaders() {
  if (IS_PRODUCTION_DEPLOY) return []

  return [
    {
      source: '/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    },
  ]
}
