import { SERVICE_NAME } from '@bconnect/config/site'

const EFFECTIVE_DATE = '2026년 7월 6일'
const CONTACT_EMAIL = 'morton.career@gmail.com'
const OPERATOR = 'Morton'

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: 'purpose',
    title: '목적',
    body: (
      <p>
        이 약관은 {OPERATOR}(이하 ‘운영자’)가 제공하는 ‘{SERVICE_NAME}’ 서비스(이하 ‘서비스’)의
        이용과 관련하여 운영자와 회원 간의 권리·의무 및 책임사항, 이용 조건과 절차 등 기본적인
        사항을 규정함을 목적으로 합니다.
      </p>
    ),
  },
  {
    id: 'definitions',
    title: '용어의 정의',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>
          ‘서비스’란 운영자가 기술자와 업체를 연결하기 위해 제공하는 온라인 매칭 플랫폼을 말합니다.
        </li>
        <li>
          ‘회원’이란 이 약관에 동의하고 서비스 이용계약을 체결한 자를 말하며, 기술자 회원과 업체
          회원으로 구분합니다.
        </li>
        <li>‘기술자’란 시공·기술 용역을 제공할 목적으로 가입한 회원을 말합니다.</li>
        <li>‘업체’란 기술자를 구하거나 시공을 의뢰할 목적으로 가입한 회원을 말합니다.</li>
        <li>
          ‘게시물’이란 회원이 서비스에 게시한 프로필, 글, 사진, 서류 등 일체의 정보를 말합니다.
        </li>
      </ul>
    ),
  },
  {
    id: 'terms-effect',
    title: '약관의 명시·효력 및 변경',
    body: (
      <>
        <p>
          이 약관은 서비스 화면에 게시하여 회원에게 공지함으로써 효력이 발생합니다. 운영자는 관계
          법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.
        </p>
        <p>
          약관을 변경하는 경우 적용일자 및 변경사유를 명시하여 적용일 7일 전(회원에게 불리하거나
          중대한 변경은 30일 전)부터 서비스 내 공지사항을 통해 고지합니다. 회원이 변경 약관에
          동의하지 않는 경우 이용계약을 해지할 수 있습니다.
        </p>
      </>
    ),
  },
  {
    id: 'contract',
    title: '이용계약의 성립',
    body: (
      <>
        <p>
          이용계약은 이용자가 이 약관과 개인정보 수집·이용에 동의하고 회원가입을 신청한 후 운영자가
          이를 승낙함으로써 성립합니다.
        </p>
        <p>
          운영자는 다음 각 호에 해당하는 신청에 대하여는 승낙을 거부하거나 사후에 이용계약을 해지할
          수 있습니다.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>타인의 명의나 정보를 도용하여 신청한 경우</li>
          <li>허위 정보를 기재하거나 운영자가 요청하는 정보를 제공하지 않은 경우</li>
          <li>관계 법령을 위반하거나 서비스의 정상적인 운영을 방해할 목적으로 신청한 경우</li>
        </ul>
      </>
    ),
  },
  {
    id: 'service',
    title: '서비스의 제공 및 변경',
    body: (
      <>
        <p>운영자는 회원에게 다음과 같은 서비스를 제공합니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>기술자·업체 프로필 등록 및 조회</li>
          <li>기술자와 업체 간 연결·매칭 및 메시지 기능</li>
          <li>그 밖에 운영자가 정하는 서비스</li>
        </ul>
        <p>
          운영자는 서비스의 내용, 이용 방법, 이용 시간을 변경할 수 있으며, 변경 시 그 내용을 서비스
          내에 공지합니다.
        </p>
      </>
    ),
  },
  {
    id: 'suspension',
    title: '서비스의 중단',
    body: (
      <p>
        운영자는 시스템 점검·보수·교체, 통신 두절, 천재지변 등 부득이한 사유가 있는 경우 서비스의
        전부 또는 일부를 일시적으로 중단할 수 있습니다. 이 경우 운영자는 사전에 공지하되, 부득이한
        경우 사후에 공지할 수 있습니다.
      </p>
    ),
  },
  {
    id: 'member-duty',
    title: '회원의 의무',
    body: (
      <>
        <p>회원은 다음 각 호의 행위를 하여서는 안 됩니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>허위 정보의 등록 또는 타인의 정보 도용</li>
          <li>운영자 또는 제3자의 지식재산권·명예·권리를 침해하는 행위</li>
          <li>서비스의 정상적인 운영을 방해하는 행위</li>
          <li>법령 또는 공서양속에 위반되는 정보를 게시하거나 전송하는 행위</li>
          <li>서비스를 통해 알게 된 다른 회원의 정보를 목적 외로 이용하는 행위</li>
        </ul>
      </>
    ),
  },
  {
    id: 'operator-duty',
    title: '운영자의 의무',
    body: (
      <p>
        운영자는 관계 법령과 이 약관이 정하는 바에 따라 지속적이고 안정적으로 서비스를 제공하기 위해
        노력하며, 회원의 개인정보를 「개인정보 보호법」 및 개인정보 처리방침에 따라 보호합니다.
      </p>
    ),
  },
  {
    id: 'content',
    title: '게시물의 관리 및 저작권',
    body: (
      <>
        <p>
          회원이 서비스에 게시한 게시물의 저작권은 해당 회원에게 있습니다. 다만 운영자는 서비스의
          운영·전시·홍보 목적으로 필요한 범위 내에서 이를 이용할 수 있습니다.
        </p>
        <p>
          운영자는 게시물이 법령 또는 이 약관을 위반하거나 타인의 권리를 침해한다고 판단하는 경우
          사전 통지 없이 해당 게시물을 삭제하거나 게시를 제한할 수 있습니다.
        </p>
      </>
    ),
  },
  {
    id: 'intermediary',
    title: '중개 서비스의 성격',
    body: (
      <p>
        운영자는 기술자와 업체 간의 연결을 중개하는 통신판매중개자로서 거래의 당사자가 아니며, 회원
        간에 이루어지는 시공 계약·대금 지급·용역 이행 등 일체의 거래에 대하여 책임을 지지 않습니다.
        회원 간 거래에서 발생하는 분쟁은 해당 당사자 간에 해결하여야 합니다.
      </p>
    ),
  },
  {
    id: 'liability',
    title: '책임의 제한',
    body: (
      <p>
        운영자는 천재지변, 회원의 귀책사유, 제3자의 불법행위 등 운영자의 고의 또는 과실 없이 발생한
        손해에 대하여는 책임을 지지 않습니다. 또한 운영자는 회원이 서비스를 통해 얻은 정보의 정확성,
        회원 간 거래의 성사 여부에 대하여 보증하지 않습니다.
      </p>
    ),
  },
  {
    id: 'termination',
    title: '이용제한 및 회원 탈퇴',
    body: (
      <>
        <p>
          회원은 언제든지 서비스 내 설정을 통해 이용계약의 해지(회원 탈퇴)를 신청할 수 있으며,
          운영자는 관계 법령이 정하는 바에 따라 이를 처리합니다.
        </p>
        <p>
          운영자는 회원이 이 약관 또는 관계 법령을 위반하는 경우 사전 통지 후 이용을 제한하거나
          이용계약을 해지할 수 있습니다. 다만 위반 정도가 중대한 경우 즉시 이용을 제한할 수
          있습니다.
        </p>
      </>
    ),
  },
  {
    id: 'damages',
    title: '손해배상',
    body: (
      <p>
        회원이 이 약관을 위반하거나 관계 법령을 위반하여 운영자 또는 제3자에게 손해를 입힌 경우,
        해당 회원은 그 손해를 배상할 책임이 있습니다.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: '준거법 및 분쟁의 해결',
    body: (
      <>
        <p>
          이 약관 및 서비스 이용과 관련한 분쟁에는 대한민국 법령을 적용하며, 운영자와 회원 간에
          발생한 분쟁은 상호 협의하여 해결하는 것을 원칙으로 합니다.
        </p>
        <p>
          협의가 이루어지지 않을 경우 「민사소송법」이 정하는 관할 법원에 소를 제기할 수 있습니다.
          서비스 이용에 관한 문의는 아래 연락처로 접수할 수 있습니다.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            이메일:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
              {CONTACT_EMAIL}
            </a>
          </li>
        </ul>
      </>
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

export function TermsOfServiceView() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6">
      <header className="flex flex-col gap-2 border-b border-gray-200 pb-6">
        <h1 className="text-sb-24 text-gray-900">이용약관</h1>
        <p className="text-r-14 text-gray-500">시행일: {EFFECTIVE_DATE}</p>
        <p className="text-r-14 leading-relaxed text-gray-700">
          이 약관은 {OPERATOR}(이하 ‘운영자’)가 제공하는 ‘{SERVICE_NAME}’ 서비스의 이용 조건과 절차,
          운영자와 회원의 권리·의무를 정합니다. 회원가입 시 이 약관에 동의한 것으로 봅니다.
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
