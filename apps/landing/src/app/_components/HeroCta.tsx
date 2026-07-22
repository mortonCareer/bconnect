import { SITE_URL } from '@bconnect/config/site'

export function HeroCta({ label }: { label: string }) {
  return (
    <a
      href={`${SITE_URL.plan}/login`}
      className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-lg font-bold text-primary shadow-lg shadow-primary-950/20 transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      {label}
      <span aria-hidden>→</span>
    </a>
  )
}
