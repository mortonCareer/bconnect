import Image from 'next/image'
import { HERO } from '../_data'
import { HeroCta } from './HeroCta'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-primary-600">
      <Image
        src="/landing/hero-tools.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary-600/60 via-primary-600/50 to-primary-700/85" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-24 text-center sm:px-6 sm:py-32">
        <span className="mb-6 inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur">
          {HERO.badge}
        </span>
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
          {HERO.titleLead}
          <br />
          <span className="text-primary-100">{HERO.titleMain}</span>
        </h1>
        <p className="mt-5 text-base text-primary-100/90 sm:text-lg">{HERO.subtitle}</p>
        <div className="mt-9">
          <HeroCta label={HERO.ctaLabel} />
        </div>
      </div>
    </section>
  )
}
