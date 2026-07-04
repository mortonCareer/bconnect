import Link from 'next/link'

export function HeroCta({ label }: { label: string }) {
  return (
    <Link
      href="/signup"
      className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-lg font-bold text-primary shadow-lg shadow-primary-950/20 transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      {label}
      <span aria-hidden>→</span>
    </Link>
  )
}
