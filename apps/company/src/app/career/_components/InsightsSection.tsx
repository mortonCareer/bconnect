import { INSIGHTS } from '../_data'
import { SectionHead } from './SectionHead'

export function InsightsSection() {
  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-6">
        <SectionHead label="INSIGHTS" title="건설 시장의 변화, 품앗이가 앞서갑니다" />
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {INSIGHTS.map((insight) => {
            const isDark = insight.tone === 'dark'
            return (
              <div
                key={insight.title}
                className={`rounded-3xl p-8 sm:p-10 ${isDark ? 'bg-primary' : 'bg-[#C9E2FF]'}`}
              >
                <span className="text-4xl">{insight.emoji}</span>
                <h3
                  className={`mt-6 text-xl font-bold sm:text-2xl ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {insight.title}
                </h3>
                <p
                  className={`mt-3 text-base leading-relaxed ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {insight.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
