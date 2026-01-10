import { registerOTel } from '@vercel/otel'

export function register() {
  registerOTel({ serviceName: 'morton-career' })
}
