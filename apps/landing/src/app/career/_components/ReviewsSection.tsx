import Image from 'next/image'
import { REVIEWS } from '../_data'
import { SectionHead } from './SectionHead'

export function ReviewsSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-6">
        <SectionHead label="REVIEWS" title="사용 후기" subtitle="먼저 써보신 기술자님들의 이야기" />
        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {REVIEWS.map((review) => (
            <li
              key={review.name + review.role}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-6"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Image
                    key={i}
                    src="/landing/star.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                ))}
              </div>
              <p className="mt-4 leading-relaxed text-gray-700">{review.quote}</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {review.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{review.name}</p>
                  <p className="text-xs text-gray-500">{review.role}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
