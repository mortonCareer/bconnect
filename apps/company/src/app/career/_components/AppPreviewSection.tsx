import Image from 'next/image'
import { PREVIEWS } from '../_data'

export function AppPreviewSection() {
  return (
    <section className="bg-gradient-to-br from-primary-500 to-primary-700 py-20 sm:py-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-5 sm:px-6">
        {PREVIEWS.map((preview) => (
          <div
            key={preview.title}
            className="flex flex-col items-center gap-10 lg:gap-16 lg:flex-row"
          >
            <div className="relative w-64 shrink-0">
              <div className="relative overflow-hidden rounded-3xl border-8 border-gray-900 bg-gray-900 shadow-2xl">
                <span className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-gray-700" />
                <Image
                  src={preview.image}
                  alt={preview.imageAlt}
                  width={280}
                  height={606}
                  className="h-auto w-full"
                />
              </div>
            </div>

            <div className="flex-1 text-center lg:text-left">
              <p className="text-sm font-bold tracking-wider text-primary-200">{preview.label}</p>
              <h2 className="mt-3 whitespace-pre-line text-3xl font-bold leading-snug text-white sm:text-4xl">
                {preview.title}
              </h2>
              <p className="mt-4 text-base text-primary-100/85">{preview.desc}</p>
              <ul className="mt-8 inline-flex flex-col gap-3 text-left">
                {preview.bullets.map((bullet) => (
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
        ))}
      </div>
    </section>
  )
}
