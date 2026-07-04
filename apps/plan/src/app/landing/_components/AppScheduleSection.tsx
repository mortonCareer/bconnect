import Image from 'next/image'
import { PREVIEW } from '../_data'

export function AppScheduleSection() {
  return (
    <section className="bg-gradient-to-br from-primary-500 to-primary-700 py-20 sm:py-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-5 sm:px-6 lg:flex-row lg:gap-16">
        <div className="w-full shrink-0 lg:w-7/12">
          <Image
            src={PREVIEW.image}
            alt={PREVIEW.imageAlt}
            width={624}
            height={452}
            sizes="(min-width: 1024px) 672px, 100vw"
            className="h-auto w-full drop-shadow-2xl"
          />
        </div>

        <div className="flex-1 text-center lg:text-left">
          <p className="text-sm font-bold tracking-wider text-primary-200">{PREVIEW.label}</p>
          <h2 className="mt-3 text-3xl font-bold leading-snug text-white sm:text-4xl">
            {PREVIEW.title}
          </h2>
          <p className="mt-4 text-base text-primary-100/85">{PREVIEW.desc}</p>
          <ul className="mt-8 inline-flex flex-col gap-3 text-left">
            {PREVIEW.bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-2.5">
                <Image
                  src="/landing/check.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0"
                />
                <span className="text-base text-white/90">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
