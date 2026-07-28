import Image from 'next/image'
import { FEATURES } from '../_data'
import { SectionHead } from './SectionHead'

export function FeaturesSection() {
  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <SectionHead label="FEATURES" title="품앗이가 도와드릴게요" />
        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5"
            >
              <Image src={feature.icon} alt="" width={56} height={56} className="h-14 w-14" />
              <h3 className="mt-5 text-lg font-bold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{feature.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
