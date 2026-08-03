export const IS_PRODUCTION_DEPLOY = process.env.VERCEL_ENV === 'production'

export function noindexHeaders() {
  if (IS_PRODUCTION_DEPLOY) return []

  return [
    {
      source: '/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    },
  ]
}
