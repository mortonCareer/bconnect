// Mock 데이터 시드 — apps/mock-server/server.js 에서 이전.
// 핸들러 간 공유하는 단일 in-memory 데이터셋.
// MSW 핸들러는 이 데이터를 mutate 하므로 dev 세션 내에서 상태가 유지됨
// (페이지 새로고침으로 SW 가 재시작해도 모듈은 dev 서버 측 ESM 캐시에 살아있어
//  data store 는 일반적으로 유지됨; 강제 리셋 필요 시 dev 서버 재시작).

const NAMES = [
  '김철수',
  '이영희',
  '박민수',
  '정수진',
  '최동욱',
  '한미영',
  '송재호',
  '윤서연',
  '강태현',
  '임지은',
]

const USERNAMES = [
  'kimcs',
  'leeyh',
  'parkms',
  'jungsj',
  'choidw',
  'hanmy',
  'songjh',
  'yoonsy',
  'kangth',
  'limje',
]

const ROLES = [
  'WORKER',
  'FOREMAN',
  'WORKER',
  'CONTRACTOR',
  'WORKER',
  'ARCHITECT',
  'WORKER',
  'FOREMAN',
  'WORKER',
  'WORKER',
]

const TRADES = [
  'DESIGN',
  'DEMOLITION',
  'ELECTRICAL',
  'PLUMBING',
  'MECHANICAL',
  'MASONRY',
  'CARPENTRY',
  'GLAZING',
  'WATERPROOFING',
  'PLASTERING',
  'INSULATION',
  'TILING',
  'GROUTING',
  'PAINTING',
  'WALLPAPER',
  'FILM_SHEET',
  'HARDWOOD',
  'VINYL',
  'SINK',
  'FURNITURE',
  'AIR_CONDITIONING',
  'HOISTING',
  'TRANSPORT',
  'CLEANING',
  'GENERAL_LABOR',
]

const CITIES = ['서울특별시', '경기도 수원시', '부산광역시', '대전광역시', '인천광역시']
const STATES = ['강남구', '영통구', '해운대구', '유성구', '남동구']
const COMPANIES = ['대림건설', '현대건설', '삼성물산', 'GS건설', '포스코건설']

const TASK_TITLES = [
  '아파트 신축공사',
  '오피스텔 리모델링',
  '상가 인테리어',
  '주택 증축공사',
  '빌딩 외벽 보수',
]

const EVENT_TITLES = [
  '1차 골조공사',
  '2차 마감공사',
  '설비 배관작업',
  '전기 배선작업',
  '도장 마감작업',
]

const POST_CONTENTS = [
  '오늘 현장 마무리 잘 됐습니다. 내일 타일작업 시작합니다.',
  '비가 와서 외부 작업은 중단하고 내부 마감 진행했습니다.',
  '배관 작업 완료했습니다. 누수 테스트 통과!',
  '전기 배선 1차 완료. 감리 확인 대기 중입니다.',
  '도배 작업 3층까지 완료. 내일 4-5층 진행 예정.',
  '에어컨 설치 완료했습니다. 시운전 이상 없습니다.',
  '타일 시공 중 자재 추가 필요합니다. 발주 요청드립니다.',
  '목공 작업 순조롭게 진행 중입니다. 일정 내 완료 가능합니다.',
  '방수 작업 2차 코팅까지 완료. 양생 기간 필요합니다.',
  '철거 작업 완료. 폐기물 반출 내일 오전 예정.',
  '도장 작업 프라이머 도포 완료. 건조 후 상도 진행합니다.',
  '싱크대 설치 완료했습니다. 배수 테스트 정상.',
  '유리 시공 완료. 실리콘 양생 24시간 필요합니다.',
  '단열재 시공 완료. 기밀 테스트 통과했습니다.',
  '현장 정리 및 청소 완료. 준공검사 준비 중입니다.',
]

const CHAT_TITLES = [
  '대림건설 현장 A',
  '현대건설 마감팀',
  '삼성물산 설비',
  'GS건설 인테리어',
  '포스코 외벽팀',
  '강남 오피스텔',
  '수원 아파트 3차',
  '부산 상가 리모델링',
  '대전 주택 증축',
  '인천 빌딩 보수',
  '서초 타일팀',
  '판교 전기팀',
  '분당 배관팀',
  '일산 도배팀',
  '평택 철거팀',
  '화성 목공팀',
  '용인 방수팀',
  '안양 도장팀',
  '성남 설치팀',
  '시흥 청소팀',
  '광명 골조팀',
  '하남 마감팀',
  '구리 설비팀',
  '남양주 인테리어',
  '파주 현장',
]

const MESSAGE_CONTENTS = [
  '안녕하세요, 내일 현장 몇 시에 출근하면 될까요?',
  '오전 8시까지 와주시면 됩니다.',
  '자재는 이미 현장에 도착해 있습니다.',
  '알겠습니다. 준비물 따로 챙길 것 있나요?',
  '안전모랑 안전화는 필수입니다.',
  '네, 알겠습니다. 감사합니다.',
  '오늘 작업 진행 상황 공유드립니다.',
  '3층까지 완료했고 내일 4층 진행합니다.',
  '일정대로 잘 진행되고 있네요.',
  '자재 추가 발주 필요한 부분이 있습니다.',
  '어떤 자재인가요? 수량도 알려주세요.',
  '타일 30박스 추가 필요합니다.',
  '발주 넣었습니다. 내일 오전 도착 예정입니다.',
  '감사합니다. 빠른 처리 감사드립니다.',
  '현장 사진 공유드립니다.',
  '잘 진행되고 있네요. 수고하셨습니다.',
  '감리 일정 확인해 주세요.',
  '다음 주 월요일 오전으로 잡혀있습니다.',
  '준공 검사 준비사항 공유합니다.',
  '서류 준비는 제가 하겠습니다.',
  '안전 교육 일정 안내드립니다.',
  '이번 주 금요일 오후 2시입니다.',
  '참석 인원 명단 보내주세요.',
  '오늘 중으로 보내드리겠습니다.',
  '날씨가 좋으니 외부 작업 진행합시다.',
  '네, 바로 준비하겠습니다.',
  '점심 식사 같이 하실까요?',
  '좋습니다. 12시에 현장 앞에서 만나요.',
  '작업 완료 보고드립니다.',
  '고생 많으셨습니다. 내일도 잘 부탁드립니다.',
]

const now = new Date()
export const isoNow = now.toISOString()

export function dateOffset(days: number): string {
  return new Date(now.getTime() + days * 86400000).toISOString()
}

export function dateOnly(days: number): string {
  return new Date(now.getTime() + days * 86400000).toISOString().split('T')[0]!
}

export interface Member {
  id: number
  username: string
  name: string
  phone: string
  picture: string
  role: string
  createdAt: string
  modifiedAt: string
}

export interface Profile {
  id: number
  memberId: number
  primaryTrade: string
  trades: string[]
  experience: number
  headline: string
  about: string
  address: {
    zipcode: string
    city: string
    state: string
    street: string
    detail: string | null
    latitude: number
    longitude: number
  }
  createdAt: string
  modifiedAt: string
}

export interface Task {
  id: number
  company: string
  address: Profile['address']
  taskTitle: string
  eventTitle: string
  trades: string[]
  start: string
  end: string
  createdAt: string
  modifiedAt: string
}

export interface Post {
  id: number
  authorId: number
  taskId: number
  images: string[]
  content: string
  createdAt: string
  modifiedAt: string
}

export interface ChatMessage {
  id: number
  chatId: number
  senderId: number
  content: string
  createdAt: string
  modifiedAt: string
}

export interface Chat {
  id: number
  title: string
  participantIds: number[]
  lastMessage: ChatMessage
  unreadCount: number
  createdAt: string
  modifiedAt: string
}

export const members: Member[] = NAMES.map((name, i) => ({
  id: i + 1,
  username: USERNAMES[i]!,
  name,
  phone: `010${String(10000000 + i).slice(1)}`,
  picture: `https://picsum.photos/seed/${USERNAMES[i]}/200`,
  role: ROLES[i]!,
  createdAt: dateOffset(-30),
  modifiedAt: isoNow,
}))

export const profiles: Profile[] = members.map((m, i) => ({
  id: i + 1,
  memberId: m.id,
  primaryTrade: TRADES[i % TRADES.length]!,
  trades: [TRADES[i % TRADES.length]!, TRADES[(i + 5) % TRADES.length]!],
  experience: 2 + ((i * 3) % 20),
  headline: `${TRADES[i % TRADES.length]} 전문 기술자`,
  about: `${m.name}입니다. ${2 + ((i * 3) % 20)}년 경력의 숙련된 기술자입니다. 안전하고 꼼꼼한 시공을 약속드립니다.`,
  address: {
    zipcode: `${10000 + i * 1111}`,
    city: CITIES[i % CITIES.length]!,
    state: STATES[i % STATES.length]!,
    street: `건설로 ${(i + 1) * 10}`,
    detail: `${i + 1}층`,
    latitude: 37.5 + i * 0.01,
    longitude: 127.0 + i * 0.01,
  },
  createdAt: dateOffset(-30),
  modifiedAt: isoNow,
}))

export const tasks: Task[] = COMPANIES.map((company, i) => ({
  id: i + 1,
  company,
  address: {
    zipcode: `${20000 + i * 1111}`,
    city: CITIES[i]!,
    state: STATES[i]!,
    street: `공사로 ${(i + 1) * 100}`,
    detail: null,
    latitude: 37.5 + i * 0.02,
    longitude: 127.0 + i * 0.02,
  },
  taskTitle: TASK_TITLES[i]!,
  eventTitle: EVENT_TITLES[i]!,
  trades: [TRADES[i * 2]!, TRADES[i * 2 + 1]!],
  start: dateOnly(-30 + i * 10),
  end: dateOnly(30 + i * 10),
  createdAt: dateOffset(-30),
  modifiedAt: isoNow,
}))

export const posts: Post[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  authorId: (i % 10) + 1,
  taskId: (i % 5) + 1,
  images: i % 3 === 0 ? [`https://picsum.photos/seed/post${i}/400/300`] : [],
  content: POST_CONTENTS[i % POST_CONTENTS.length]!,
  createdAt: dateOffset(-i * 0.5),
  modifiedAt: dateOffset(-i * 0.5),
}))

export const chats: Chat[] = CHAT_TITLES.map((title, i) => {
  const participantIds = [1, (i % 9) + 2]
  return {
    id: i + 1,
    title,
    participantIds,
    lastMessage: {
      id: i * 50 + 1,
      chatId: i + 1,
      senderId: participantIds[i % 2]!,
      content: MESSAGE_CONTENTS[i % MESSAGE_CONTENTS.length]!,
      createdAt: dateOffset(-i * 0.3),
      modifiedAt: dateOffset(-i * 0.3),
    },
    unreadCount: i % 4 === 0 ? 0 : (i % 7) + 1,
    createdAt: dateOffset(-60),
    modifiedAt: dateOffset(-i * 0.3),
  }
})

export const allMessages: Map<number, ChatMessage[]> = new Map()
for (const chat of chats) {
  const count = 40 + (chat.id % 11)
  const msgs: ChatMessage[] = Array.from({ length: count }, (_, j) => ({
    id: chat.id * 1000 + j + 1,
    chatId: chat.id,
    senderId: chat.participantIds[j % 2]!,
    content: MESSAGE_CONTENTS[j % MESSAGE_CONTENTS.length]!,
    createdAt: dateOffset(-count + j),
    modifiedAt: dateOffset(-count + j),
  }))
  allMessages.set(chat.id, msgs)
}

export const TRADE_VALUES = TRADES
export const ROLE_VALUES = Array.from(new Set(ROLES))
