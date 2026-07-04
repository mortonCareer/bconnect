import { FAQS } from '../_data'
import { SectionHead } from './SectionHead'

export function FaqSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-6">
        <SectionHead label="FAQ" title="자주 묻는 질문" />
        <dl className="mt-12 flex flex-col gap-4">
          {FAQS.map((faq) => (
            <div key={faq.q} className="rounded-2xl bg-gray-50 p-6 sm:p-7">
              <dt className="text-lg font-bold text-primary">{faq.q}</dt>
              <dd className="mt-3 leading-relaxed text-gray-600">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
