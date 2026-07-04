export const HERO = {
  badge: '인테리어 사업자 필수 툴',
  titleLead: '인테리어 사업자를 위한',
  titleMain: '공정표 기반 하도급 플랫폼, 품앗이',
  subtitle: '일정 관리부터 대금 수취까지, 품앗이가 함께합니다',
  ctaLabel: '지금 시작하기',
}

export const PROBLEM = {
  label: 'PROBLEM',
  title: '이런 분들에게 필요해요',
  quote: '"수십 개의 시공 분야... 일일이 전화해서 섭외하고, 일정 조율하고... 정말 번거로우셨죠?"',
  punchline: '👋  이제는 안녕! 그 복잡한 작업, 품앗이가 끝내드릴게요.',
}

export const FEATURES: { icon: string; title: string; desc: string }[] = [
  {
    icon: '/landing/feature-comm.svg',
    title: '한 번에 끝내는 소통',
    desc: '일정이랑 견적, 일일이 통화하지 마세요. 품앗이에서 한 번에 해결해요.',
  },
  {
    icon: '/landing/feature-settlement.svg',
    title: '간편한 통합 정산',
    desc: '여러 기술자에게 나갈 대금, 품앗이가 프로젝트별로 알아서 정산해드려요.',
  },
  {
    icon: '/landing/feature-labor.svg',
    title: '빈틈없이 바로 찾는 인력',
    desc: '공정표를 보고 필요한 공정에 맞는 기술자를 바로 섭외할 수 있어요.',
  },
  {
    icon: '/landing/feature-monitor.svg',
    title: '실시간 현장 모니터링',
    desc: '현장에 매일 가지 않아도 사진과 작업 보고로 상황을 한눈에 파악하세요.',
  },
]

export const PREVIEW = {
  label: 'APP PREVIEW',
  title: '한 눈에 보는 공정표와 기술자 섭외',
  desc: '공정표에서 바로 필요한 기술자를 찾고 섭외하세요.',
  bullets: [
    '간트 차트 기반 공정표로 작업별 일정과 상태를 한눈에 파악',
    '클릭 한 번으로 섭외되는 기술자 자동 추천 서비스',
  ],
  image: '/landing/preview-schedule.png',
  imageAlt: '품앗이 공정표 및 기술자 섭외 화면',
}

export const REVIEWS: { quote: string; name: string; role: string }[] = [
  {
    quote:
      '"공정표에서 바로 기술자 섭외가 되니까 전화 돌리는 시간이 확 줄었어요. 이제 현장 관리에만 집중합니다."',
    name: '김OO님',
    role: '인테리어 업체 대표',
  },
  {
    quote:
      '"처음엔 지인 소개로만 했는데, 막상 급할 때는 소개가 없어서 공정이 계속 밀리더라고요. 필요한 공정에 맞춰 바로 찾을 수 있어서 도움 됐어요."',
    name: '윤OO님',
    role: '인테리어 업체 대표',
  },
  {
    quote:
      '"현장마다 팀원이 달라서 섭외 현황 파악이 골치였는데, 이젠 앱에서 바로 보이니까 좋아요."',
    name: '최OO',
    role: '시공 소장',
  },
  {
    quote:
      '"정산할 때마다 엑셀 뒤지느라 시간 잡아먹었는데, 이제 프로젝트별로 자동 정리되니까 월말이 편해졌어요."',
    name: '정OO',
    role: '인테리어 업체 대표',
  },
]

export const INSIGHTS: {
  emoji: string
  title: string
  desc: string
  tone: 'dark' | 'light'
}[] = [
  {
    emoji: '📉',
    title: '영업과 섭외의 짐, 저희가 덜어드릴게요',
    desc: '데이터 기반의 매칭으로 최적의 시공 품질을 도와드려요.',
    tone: 'dark',
  },
  {
    emoji: '🤝',
    title: '신뢰가 돈이 되는 생태계',
    desc: '투명한 이력과 평가를 통해 인테리어 업계의 새로운 기준을 만들어 갑니다.',
    tone: 'light',
  },
]

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'Q. 서비스 이용료는 얼마인가요?',
    a: 'A. 단일 프로젝트의 공정표 관리는 무제한 무료입니다. 여러 현장을 동시에 관리하고 싶으시다면 월 39,000원(구독)으로 모든 기능을 이용하실 수 있습니다.',
  },
  {
    q: 'Q. 모바일로도 확인할 수 있나요?',
    a: 'A. 현재는 PC에서만 이용 가능합니다. 공정표를 큰 화면에서 보면서 조율하는 게 핵심이라, 먼저 PC 버전부터 안정적으로 만들고 있어요. 모바일은 준비 중입니다.',
  },
  {
    q: 'Q. 견적/도면 등 작업 정보도 한 번에 보낼 수 있나요?',
    a: 'A. 네. 반장님들에게 견적, 도면 등 작업 지시에 공통된 내용을 한 번에 공유할 수 있고, 모든 대화와 파일이 기록으로 남습니다. 혹시 법적 분쟁이 생기더라도 참고자료로 활용할 수 있어요.',
  },
]

export const CTA = {
  titleLead: '인테리어 사업자를 위한',
  titleMain: '공정표 기반 하도급 플랫폼, 품앗이',
  subtitle: '가입하고 첫 프로젝트를 시작해보세요.',
  ctaLabel: '지금 시작하기',
}
