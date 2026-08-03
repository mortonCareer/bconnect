export const IS_PRODUCTION_DEPLOY =
  (process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV) === 'production'
