export const HERO = {
  badge: '• 8월 출시 예정',
  titleLead: '인테리어 기술자를 위한',
  titleMain: '캘린더 기반 하도급 플랫폼, 품앗이',
  subtitle: '일정 관리부터 대금 수취까지, 품앗이가 함께합니다',
  ctaLabel: '베타 테스트',
}

export const PROBLEM = {
  label: 'PROBLEM',
  title: '이런 분들에게 필요해요',
  subtitle: '기술자분들이 자주 겪는 불편함이에요',
  quote: '"일정 관리하랴 품앗이 챙기랴, 거기에 임금 체불 걱정까지... 마음 편할 날이 없으셨죠?"',
  punchline: '👋  이제는 안녕! 불안한 마음, 품앗이가 싹 없애드릴게요.',
}

export const FEATURES: { icon: string; title: string; desc: string }[] = [
  {
    icon: '/landing/feature-schedule.svg',
    title: '팀 일정 공유',
    desc: '현장명, 위치, 시간을 한 번에 확인하고 팀원과 일감을 간편하게 공유해요',
  },
  {
    icon: '/landing/feature-settlement-career.svg',
    title: '투명한 정산 시스템',
    desc: '안심하고 일만 할 수 있도록, 대금 지급 현황을 한눈에 확인할 수 있어요',
  },
  {
    icon: '/landing/feature-spec.svg',
    title: '나만의 스펙 쌓기',
    desc: "품앗이에서 만든 이력과 평가가 사장님들이 먼저 찾는 '스펙'이 되게 만들어요",
  },
  {
    icon: '/landing/feature-jobs.svg',
    title: '전국 일자리 공고',
    desc: '인테리어, 팀 구인 공고를 한 곳에 전부 모았어요',
  },
]

export const PREVIEWS: {
  label: string
  title: string
  desc: string
  bullets: string[]
  image: string
  imageAlt: string
}[] = [
  {
    label: 'APP PREVIEW',
    title: '한 눈에 보는\n작업 일정과 진행 상황',
    desc: '복잡한 메뉴 없이 필요한 정보만 딱. 현장에서 한 손으로 빠르게 확인하세요.',
    bullets: [
      '캘린더에서 이번 주 일정 한눈에',
      '현장별 메모와 사진 기록',
      '팀원들과 실시간 일정 공유',
    ],
    image: '/landing/preview-calendar.png',
    imageAlt: '품앗이 캘린더 일정 화면',
  },
  {
    label: 'APP PREVIEW',
    title: '시공 사진과 경력에 기반한\n나의 작업 포트폴리오',
    desc: "전화로 설명할 필요 없이, 링크 하나로 끝. 쌓인 이력이 사장님들이 먼저 찾는 '스펙'이 됩니다.",
    bullets: [
      '작업물·계약·추천서가 한 페이지에',
      '나만의 이력으로 만드는 퍼스널 브랜딩',
      '평가가 쌓여 신뢰 자산으로',
    ],
    image: '/landing/preview-portfolio.png',
    imageAlt: '품앗이 작업 포트폴리오 화면',
  },
]

export const REVIEWS: { quote: string; name: string; role: string }[] = [
  {
    quote:
      '"일 끝나고 돈 언제 들어오나 매번 물어보기 껄끄러웠는데, 앱에서 딱 보이니까 마음이 편해요."',
    name: '김OO',
    role: '타일 준기공 7년차 · 서울',
  },
  {
    quote: '"일정이 뒤죽박죽이라 헷갈렸는데, 캘린더로 정리되니까 일하기 너무 좋아요."',
    name: '박OO',
    role: '도배 기공 8년차 · 인천',
  },
  {
    quote:
      '"현장마다 팀원이 달라서 섭외 현황 파악이 골치였는데, 이젠 앱에서 바로 보이니까 좋아요."',
    name: '이OO',
    role: '전기 반장 17년차 · 부산',
  },
  {
    quote: '"작업 사항 공유가 한곳에 정리되니까 스트레스가 확 줄었어요."',
    name: '정OO',
    role: '철거 반장 10년차 · 경기도',
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
    desc: '등록만 해두고 다양한 업체로부터 일감을 받아보세요.',
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
    a: 'A. 기술자님은 가입과 기본 기능을 무료로 이용하실 수 있어요. 다만 일감을 매칭받아 실제로 일이 성사될 때만 소정의 수수료가 발생합니다.',
  },
  {
    q: 'Q. 정말 스마트폰 하나로 다 되나요?',
    a: 'A. 네, 스마트폰만 있으면 공고 확인부터 지원, 일정 관리, 작업 보고까지 모든 기능을 이용하실 수 있습니다.',
  },
  {
    q: 'Q. 팀원들이랑 같이 쓰고 싶어요',
    a: 'A. 팀원들을 초대하면 캘린더에서 일정을 공유할 수 있습니다. "내일 시간 돼?" 물어볼 필요 없이 앱에서 팀원들의 일정을 바로 확인하세요!',
  },
]

export const CTA = {
  titleLead: '인테리어 기술자를 위한',
  titleMain: '캘린더 기반 하도급 플랫폼, 품앗이',
  subtitle: '가입하고 첫 일감을 받아보세요.',
  ctaLabel: '베타 테스트',
}
