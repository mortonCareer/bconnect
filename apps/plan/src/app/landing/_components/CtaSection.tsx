import { CTA } from '../_data'
import { HeroCta } from './HeroCta'

export function CtaSection() {
  return (
    <section className="bg-gradient-to-br from-primary-500 to-primary-700 py-24 sm:py-32">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 text-center sm:px-6">
        <h2 className="text-2xl font-bold leading-snug text-white sm:text-4xl">
          {CTA.titleLead}
          <br />
          <span className="text-primary-100">{CTA.titleMain}</span>
        </h2>
        <p className="mt-5 text-base text-primary-100/90 sm:text-lg">{CTA.subtitle}</p>
        <div className="mt-9">
          <HeroCta label={CTA.ctaLabel} />
        </div>
      </div>
    </section>
  )
}
