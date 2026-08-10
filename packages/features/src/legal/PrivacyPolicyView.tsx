import { SERVICE_NAME } from '@bconnect/config/site'

const EFFECTIVE_DATE = '2026년 7월 6일'
const CONTACT_EMAIL = 'morton.career@gmail.com'
const OPERATOR = 'Morton'
const GA_OPT_OUT_URL = 'https://tools.google.com/dlpage/gaoptout'

const OFFICER = {
  name: '이송목',
  email: CONTACT_EMAIL,
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-xl border-collapse text-r-12 text-gray-700">
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

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: 'purpose',
    title: '개인정보의 처리 목적',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>회원 식별·인증 및 부정 이용 방지</li>
        <li>기술자-업체 매칭 및 서비스 제공</li>
        <li>고객 문의 응대 및 공지사항 전달</li>
        <li>서비스 이용 통계 분석 및 품질 개선</li>
      </ul>
    ),
  },
  {
    id: 'items',
    title: '처리하는 개인정보의 항목',
    body: (
      <>
        <p>
          운영자는 서비스 제공을 위해 아래와 같은 개인정보를 처리하며, 처리 목적에 필요한 최소한의
          항목만 수집합니다.
        </p>
        <Table
          head={['구분', '수집 항목', '수집 방법']}
          rows={[
            [
              '회원가입·본인인증 (필수)',
              '휴대전화번호, 인증번호',
              '휴대전화 문자(SMS)·알림톡(OTP) 인증',
            ],
            [
              '프로필 (선택)',
              '이름, 닉네임, 시공분야·대표분야, 경력, 소속, 활동지역, 회원유형, 한줄소개, 프로필 사진, 자격 증명 서류 (기술자) · 상호·사업자등록번호 (업체)',
              '이용자 직접 입력·업로드',
            ],
            [
              '자동 수집',
              '쿠키, 접속 IP, 기기·브라우저 정보, 서비스 이용 기록',
              '서비스 이용 과정에서 자동 생성',
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: 'children',
    title: '14세 미만 아동의 개인정보',
    body: <p>운영자는 만 14세 미만 아동의 개인정보를 수집하거나 처리하지 않습니다.</p>,
  },
  {
    id: 'retention',
    title: '개인정보의 처리 및 보유 기간',
    body: (
      <>
        <p>
          원칙적으로 개인정보 수집·이용 목적이 달성되면 지체 없이 파기합니다. 다만 회원 정보는 회원
          탈퇴 시까지 보유하며, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>회원 정보: 회원 탈퇴 시까지</li>
          <li>관계 법령에 따른 보존이 필요한 경우: 해당 법령이 정한 기간</li>
        </ul>
      </>
    ),
  },
  {
    id: 'disposal',
    title: '개인정보의 파기 절차 및 방법',
    body: (
      <p>
        운영자는 개인정보 보유기간이 경과하거나 처리 목적이 달성되면 지체 없이 해당 개인정보를
        파기합니다. 전자적 파일은 복구가 불가능한 방법으로 삭제하며, 그 밖의 기록물은 분쇄하거나
        소각합니다.
      </p>
    ),
  },
  {
    id: 'thirdparty',
    title: '개인정보의 제3자 제공',
    body: (
      <p>
        운영자는 정보주체의 동의가 있거나 법령에 특별한 규정이 있는 경우를 제외하고는 개인정보를
        제3자에게 제공하지 않습니다.
      </p>
    ),
  },
  {
    id: 'consignment',
    title: '개인정보 처리의 위탁',
    body: (
      <>
        <p>
          운영자는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있습니다.
        </p>
        <Table
          head={['수탁자', '위탁 업무']}
          rows={[
            ['Railway Corporation', '서버·데이터베이스 운영(호스팅)'],
            ['Amazon Web Services, Inc.', '업로드 파일(사진·자격 증명 서류) 저장'],
            ['Vercel Inc.', '웹 애플리케이션 호스팅'],
            ['Solapi(솔라피)', '본인인증 문자(SMS)·알림톡 발송'],
            [
              'Google LLC',
              '서비스 이용 통계 분석(Google Analytics), 푸시 알림 발송(Firebase Cloud Messaging)',
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: 'transfer',
    title: '개인정보의 국외 이전',
    body: (
      <>
        <p>
          운영자는 서버·데이터베이스 운영 및 이용 통계 분석을 위해 아래와 같이 개인정보를 국외로
          이전합니다. 정보주체는 아래 거부 방법을 통해 국외 이전을 거부할 수 있습니다.
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
              'Railway Corporation',
              '싱가포르',
              '서비스 이용 과정에서 처리되는 개인정보 전체(회원정보·프로필 등)',
              '서버·데이터베이스 운영(호스팅)',
              '회원 탈퇴 또는 위탁계약 종료 시까지',
              '회원 탈퇴 또는 서비스 이용 중단',
            ],
            [
              'Vercel Inc.',
              '미국',
              '접속 IP, 기기·브라우저 정보, 서비스 이용 기록',
              '웹 애플리케이션 호스팅',
              '위탁계약 종료 시까지',
              '서비스 이용 중단',
            ],
            [
              'Google LLC',
              '미국',
              '쿠키, 접속 IP, 기기·브라우저 정보, 서비스 이용 기록',
              '서비스 이용 통계 분석',
              '수집일로부터 최대 14개월',
              '아래 자동 수집 장치(쿠키) 조의 쿠키 거부 및 Google Analytics 차단 부가기능 설치',
            ],
            [
              'Google LLC',
              '미국',
              '푸시 알림 토큰, 기기 정보',
              '푸시 알림 발송(Firebase Cloud Messaging)',
              '회원 탈퇴 또는 토큰 만료 시까지',
              '기기 또는 브라우저의 알림 설정에서 알림 차단',
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: 'security',
    title: '개인정보의 안전성 확보 조치',
    body: (
      <p>
        운영자는 개인정보의 안전한 처리를 위해 접근 권한 관리, 접속 기록 보관, 개인정보의 암호화 등
        관리적·기술적 보호 조치를 시행합니다.
      </p>
    ),
  },
  {
    id: 'cookies',
    title: '자동 수집 장치(쿠키)의 설치·운영 및 거부',
    body: (
      <>
        <p>
          운영자는 이용자에게 맞춤형 서비스를 제공하고 이용 통계를 분석하기 위해 쿠키 및 유사 기술을
          사용합니다. 이용 통계 분석에는 Google Analytics를 이용하며, 이 과정에서 쿠키 등 자동 수집
          정보가 수집됩니다.
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
      </>
    ),
  },
  {
    id: 'rights',
    title: '정보주체와 법정대리인의 권리·의무 및 행사방법',
    body: (
      <p>
        정보주체는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수 있습니다.
        권리 행사는 아래 개인정보 보호책임자에게 서면·이메일 등으로 요청할 수 있으며, 운영자는 지체
        없이 조치합니다.
      </p>
    ),
  },
  {
    id: 'officer',
    title: '개인정보 보호책임자',
    body: (
      <>
        <p>
          운영자는 개인정보 처리에 관한 업무를 총괄하고 정보주체의 문의·불만을 처리하기 위해
          개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>성명: {OFFICER.name}</li>
          <li>
            이메일:{' '}
            <a href={`mailto:${OFFICER.email}`} className="text-primary underline">
              {OFFICER.email}
            </a>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'remedy',
    title: '정보주체의 권익침해에 대한 구제방법',
    body: (
      <>
        <p>정보주체는 개인정보 침해로 인한 상담·분쟁조정·신고를 아래 기관에 문의할 수 있습니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 · www.kopico.go.kr</li>
          <li>개인정보침해신고센터: (국번없이) 118 · privacy.kisa.or.kr</li>
          <li>대검찰청 사이버수사과: (국번없이) 1301 · www.spo.go.kr</li>
          <li>경찰청 사이버수사국: (국번없이) 182 · ecrm.police.go.kr</li>
        </ul>
      </>
    ),
  },
  {
    id: 'changes',
    title: '개인정보 처리방침의 변경',
    body: (
      <p>
        이 개인정보 처리방침은 시행일부터 적용되며, 법령·정책 또는 서비스 변경에 따라 내용이
        추가·삭제·수정되는 경우 변경 사항을 시행 7일 전부터 서비스 내 공지사항을 통해 고지합니다.
      </p>
    ),
  },
]

function Section({
  index,
  id,
  title,
  body,
}: {
  index: number
  id: string
  title: string
  body: React.ReactNode
}) {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-3">
      <h2 className="text-sb-16 text-gray-900">
        제{index}조 · {title}
      </h2>
      <div className="flex flex-col gap-2 text-r-14 leading-relaxed text-gray-700">{body}</div>
    </section>
  )
}

export function PrivacyPolicyView() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6">
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-6">
        <h1 className="text-sb-24 text-gray-900">개인정보 처리방침</h1>
        <p className="text-r-14 text-gray-500">시행일: {EFFECTIVE_DATE}</p>
        <p className="text-r-14 leading-relaxed text-gray-700">
          {OPERATOR}(이하 ‘운영자’)는 ‘{SERVICE_NAME}’ 서비스(이하 ‘서비스’) 이용자의 개인정보를
          중요하게 생각하며, 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 관련
          고충을 신속하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다. 운영자는
          처리 목적에 필요한 최소한의 개인정보만 수집·이용합니다.
        </p>
      </header>

      <nav aria-label="목차" className="mt-6 rounded-lg bg-gray-50 p-4">
        <p className="text-sb-14 text-gray-900">목차</p>
        <ol className="mt-2 flex flex-col gap-1 text-r-14 text-gray-700">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-primary underline">
                제{i + 1}조 · {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 flex flex-col gap-8">
        {SECTIONS.map((s, i) => (
          <Section key={s.id} index={i + 1} id={s.id} title={s.title} body={s.body} />
        ))}
      </div>
    </main>
  )
}
