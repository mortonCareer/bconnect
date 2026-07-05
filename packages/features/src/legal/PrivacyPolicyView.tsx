import { SERVICE_NAME } from '@bconnect/config/site'

const EFFECTIVE_DATE = '2026년 7월 5일'
const CONTACT_EMAIL = 'morton.career@gmail.com'
const OPERATOR = 'Morton'
const GA_OPT_OUT_URL = 'https://tools.google.com/dlpage/gaoptout'

function Section({
  index,
  title,
  children,
}: {
  index: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sb-16 text-gray-900">
        제{index}조 · {title}
      </h2>
      <div className="flex flex-col gap-2 text-r-14 leading-relaxed text-gray-700">{children}</div>
    </section>
  )
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-r-12 text-gray-700">
        <thead>
          <tr className="bg-gray-50 text-left">
            {head.map((cell) => (
              <th key={cell} className="border border-gray-200 px-3 py-2 text-sb-12 text-gray-900">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="border border-gray-200 px-3 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PrivacyPolicyView() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6">
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-6">
        <h1 className="text-sb-24 text-gray-900">개인정보 처리방침</h1>
        <p className="text-r-14 text-gray-500">시행일: {EFFECTIVE_DATE}</p>
        <p className="text-r-14 leading-relaxed text-gray-700">
          {OPERATOR}(이하 &lsquo;운영자&rsquo;)는 &lsquo;{SERVICE_NAME}&rsquo; 서비스(이하
          &lsquo;서비스&rsquo;) 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 제30조에
          따라 정보주체의 개인정보를 보호하고 관련 고충을 신속하게 처리할 수 있도록 다음과 같이
          개인정보 처리방침을 수립·공개합니다.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-8">
        <Section index={1} title="수집하는 개인정보 항목 및 수집방법">
          <p>운영자는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.</p>
          <Table
            head={['구분', '수집 항목', '수집 방법']}
            rows={[
              ['회원가입·본인인증 (필수)', '휴대전화번호', '휴대전화 문자(OTP) 인증'],
              [
                '프로필 (선택)',
                '이름·닉네임, 프로필 사진, 경력·보유 시공분야·활동지역(기술자), 상호·사업자등록번호(업체)',
                '이용자 직접 입력',
              ],
              [
                '자동 수집',
                '쿠키, 접속 IP, 기기·브라우저 정보, 서비스 이용 기록',
                '서비스 이용 과정에서 자동 생성',
              ],
            ]}
          />
        </Section>

        <Section index={2} title="개인정보의 처리 목적">
          <ul className="list-disc space-y-1 pl-5">
            <li>회원 식별·인증 및 부정 이용 방지</li>
            <li>기술자-업체 매칭 및 서비스 제공</li>
            <li>고객 문의 응대 및 공지사항 전달</li>
            <li>서비스 이용 통계 분석 및 품질 개선</li>
          </ul>
        </Section>

        <Section index={3} title="개인정보의 보유 및 이용기간">
          <p>
            원칙적으로 개인정보 수집·이용 목적이 달성되면 지체 없이 파기합니다. 다만 회원 정보는
            회원 탈퇴 시까지 보유하며, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안
            보관합니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>회원 정보: 회원 탈퇴 시까지</li>
            <li>관계 법령에 따른 보존이 필요한 경우: 해당 법령이 정한 기간</li>
          </ul>
        </Section>

        <Section index={4} title="개인정보의 제3자 제공">
          <p>
            운영자는 정보주체의 동의가 있거나 법령에 특별한 규정이 있는 경우를 제외하고는 개인정보를
            제3자에게 제공하지 않습니다.
          </p>
        </Section>

        <Section index={5} title="개인정보 처리의 위탁">
          <p>운영자는 서비스 향상을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
          <Table
            head={['수탁자', '위탁 업무']}
            rows={[['Google LLC', '서비스 이용 통계 분석(Google Analytics)']]}
          />
        </Section>

        <Section index={6} title="개인정보의 국외 이전">
          <p>
            운영자는 이용 통계 분석을 위해 아래와 같이 개인정보를 국외로 이전합니다. 정보주체는 아래
            거부 방법을 통해 국외 이전을 거부할 수 있습니다.
          </p>
          <Table
            head={[
              '이전받는 자',
              '이전 국가',
              '이전 항목',
              '이전 목적',
              '보유·이용기간',
              '거부 방법',
            ]}
            rows={[
              [
                'Google LLC',
                '미국',
                '쿠키, 접속 IP, 기기·브라우저 정보, 서비스 이용 기록',
                '서비스 이용 통계 분석',
                '수집일로부터 최대 14개월',
                '아래 제7조의 쿠키 거부 및 Google Analytics 차단 부가기능 설치',
              ],
            ]}
          />
        </Section>

        <Section index={7} title="자동 수집 장치(쿠키)의 설치·운영 및 거부">
          <p>
            운영자는 이용자에게 맞춤형 서비스를 제공하고 이용 통계를 분석하기 위해 쿠키 및 유사
            기술을 사용합니다. 이용 통계 분석에는 Google Analytics를 이용하며, 이 과정에서 쿠키 등
            자동 수집 정보가 수집됩니다.
          </p>
          <p>이용자는 다음과 같이 쿠키 수집을 거부할 수 있습니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>웹 브라우저 설정에서 쿠키 저장을 거부하거나 저장된 쿠키를 삭제</li>
            <li>
              Google Analytics 차단:{' '}
              <a
                href={GA_OPT_OUT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Analytics 차단 브라우저 부가기능
              </a>{' '}
              설치
            </li>
          </ul>
          <p>쿠키 저장을 거부할 경우 일부 서비스 이용에 어려움이 있을 수 있습니다.</p>
        </Section>

        <Section index={8} title="정보주체의 권리·의무 및 행사방법">
          <p>
            정보주체는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수 있습니다.
            권리 행사는 아래 개인정보 보호책임자에게 서면·이메일 등으로 요청할 수 있으며, 운영자는
            지체 없이 조치합니다.
          </p>
        </Section>

        <Section index={9} title="개인정보의 파기">
          <p>
            운영자는 개인정보 보유기간이 경과하거나 처리 목적이 달성되면 지체 없이 해당 개인정보를
            파기합니다. 전자적 파일은 복구가 불가능한 방법으로 삭제하며, 그 밖의 기록물은 분쇄하거나
            소각합니다.
          </p>
        </Section>

        <Section index={10} title="개인정보의 안전성 확보 조치">
          <p>
            운영자는 개인정보의 안전한 처리를 위해 접근 권한 관리, 접속 기록 보관, 개인정보의 암호화
            등 관리적·기술적 보호 조치를 시행합니다.
          </p>
        </Section>

        <Section index={11} title="개인정보 보호책임자(고지의무자)">
          <p>
            운영자는 개인정보 처리에 관한 업무를 총괄하고 정보주체의 문의·불만을 처리하기 위해
            개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>운영자: {OPERATOR}</li>
            <li>
              연락처:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
          <p>
            개인정보 침해에 대한 상담·신고는 개인정보분쟁조정위원회(privacy.go.kr, 국번없이
            1833-6972), 개인정보침해신고센터(privacy.kisa.or.kr, 국번없이 118) 등에 문의할 수
            있습니다.
          </p>
        </Section>

        <Section index={12} title="개인정보 처리방침의 변경">
          <p>
            이 개인정보 처리방침은 시행일부터 적용되며, 법령·정책 또는 서비스 변경에 따라 내용이
            추가·삭제·수정되는 경우 변경 사항을 시행 7일 전부터 서비스 내 공지사항을 통해
            고지합니다.
          </p>
        </Section>
      </div>
    </main>
  )
}
