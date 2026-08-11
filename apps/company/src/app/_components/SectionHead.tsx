export function SectionHead({
  label,
  title,
  subtitle,
  tone = 'light',
}: {
  label: string
  title: string
  subtitle?: string
  tone?: 'light' | 'dark'
}) {
  const isDark = tone === 'dark'
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p
        className={`text-sm font-bold tracking-wider ${isDark ? 'text-primary-200' : 'text-primary'}`}
      >
        {label}
      </p>
      <h2
        className={`mt-3 text-3xl font-bold sm:text-4xl ${isDark ? 'text-white' : 'text-gray-900'}`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className={`mt-4 text-base ${isDark ? 'text-primary-100/80' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
