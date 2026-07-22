import { PROBLEM } from '../_data'
import { SectionHead } from './SectionHead'

export function ProblemSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <SectionHead label={PROBLEM.label} title={PROBLEM.title} subtitle={PROBLEM.subtitle} />
        <div className="mx-auto mt-12 max-w-3xl rounded-3xl bg-gray-50 px-6 py-12 text-center sm:px-12">
          <p className="text-lg leading-relaxed text-gray-600 sm:text-xl">{PROBLEM.quote}</p>
          <p className="mt-8 text-xl font-bold text-primary sm:text-2xl">{PROBLEM.punchline}</p>
        </div>
      </div>
    </section>
  )
}
