import { BUSINESS_INFO } from '@bconnect/config/business-info'
import { SERVICE_NAME } from '@bconnect/config/site'

const ROWS: { label: string; value: string }[] = [
  { label: '상호', value: BUSINESS_INFO.name },
  { label: '대표자', value: BUSINESS_INFO.representative },
  { label: '사업자등록번호', value: BUSINESS_INFO.registrationNumber },
  { label: '사업장 주소', value: BUSINESS_INFO.address },
  { label: '전화', value: BUSINESS_INFO.phone },
  { label: '이메일', value: BUSINESS_INFO.email },
  { label: '개인정보 보호책임자', value: BUSINESS_INFO.privacyOfficer },
]

export function BusinessInfoView() {
  const rows = ROWS.filter((row) => row.value.length > 0)

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6">
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-6">
        <h1 className="text-sb-24 text-gray-900">사업자정보</h1>
        <p className="text-r-14 leading-relaxed text-gray-700">
          ‘{SERVICE_NAME}’ 서비스를 운영하는 사업자정보를 다음과 같이 안내합니다.
        </p>
      </header>

      <dl className="mt-8 flex flex-col divide-y divide-gray-200 border-y border-gray-200">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-4 py-3">
            <dt className="w-40 shrink-0 text-sb-14 text-gray-900">{row.label}</dt>
            <dd className="text-r-14 leading-relaxed text-gray-700">{row.value}</dd>
          </div>
        ))}
      </dl>

      <nav className="mt-8 flex gap-4 text-r-14">
        <a href="/terms" className="text-primary underline">
          서비스 이용약관
        </a>
        <a href="/privacy" className="text-primary underline">
          개인정보 처리방침
        </a>
      </nav>

      <p className="mt-8 text-r-12 text-gray-400">
        © {BUSINESS_INFO.copyrightYear} {BUSINESS_INFO.name}
      </p>
    </main>
  )
}
