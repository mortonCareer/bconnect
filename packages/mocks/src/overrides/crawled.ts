import {
  getGetCrawledMemberMockHandler,
  getGetCrawledMembersMockHandler,
  CrawledPlatform,
  CrawledRegion,
} from '@bconnect/api-client'
import type { CrawledMember, CrawledMemberSummary } from '@bconnect/api-client'

// 크롤링 기술자 — plan 기술자 탐색 병합 노출용 시드.
// generated faker 응답은 무작위 문자열이라 카드/필터 QA 가 불가능 → 실데이터 유사 시드로 고정.
// trades 는 BE 원본과 동일하게 한국어 라벨 문자열 (FE 가 Trade enum 으로 역매핑).

const EPOCH = '2025-01-02T00:00:00.000Z'

const img = (seed: string, n: number) =>
  Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/${seed}-${i}/600/600`)

const SEEDS: CrawledMember[] = [
  {
    id: 9001,
    company: '바른정타일',
    name: '김정수',
    phone: '010-1234-5678',
    picture: 'https://picsum.photos/seed/crawled-9001/200/200',
    role: '반장',
    brn: '123-45-67890',
    email: '',
    createdAt: EPOCH,
    modifiedAt: EPOCH,
    profile: {
      primaryTrade: '타일',
      trades: ['타일', '줄눈', '방수'],
      experience: 15,
      headline: '수도권 타일 시공 15년, 욕실·주방 리모델링 전문입니다.',
      about:
        '안녕하세요, 바른정타일입니다.\n욕실, 주방, 현관 타일 시공을 전문으로 합니다.\n서울·경기 전 지역 출장 가능합니다.',
      address: '서울 금천구 가산디지털1로 83',
      state: CrawledRegion.SEOUL,
      url: 'https://blog.naver.com/crawled9001',
      platform: CrawledPlatform.NAVER,
    },
    credentials: [],
    posts: [
      {
        id: 1,
        memberId: 9001,
        title: '강남 아파트 욕실 타일 전체 교체',
        content: '기존 타일 철거 후 600각 포세린 타일로 시공했습니다.',
        images: img('crawled-post-1', 4),
        createdAt: EPOCH,
        modifiedAt: EPOCH,
      },
      {
        id: 2,
        memberId: 9001,
        title: '주방 벽타일 덧방 시공',
        content: '기존 타일 위 덧방으로 공기 단축.',
        images: img('crawled-post-2', 3),
        createdAt: EPOCH,
        modifiedAt: EPOCH,
      },
    ],
  },
  {
    id: 9002,
    company: '한결도배',
    name: '',
    phone: '010-2345-6789',
    picture: 'https://picsum.photos/seed/crawled-9002/200/200',
    role: '',
    brn: '',
    email: 'hangyeol@example.com',
    createdAt: EPOCH,
    modifiedAt: EPOCH,
    profile: {
      primaryTrade: '도배',
      trades: ['도배', '장판'],
      experience: undefined,
      headline: '실크·합지 도배, 장판 시공. 경기 남부 당일 견적.',
      about: '경기 남부 지역 도배·장판 전문 시공팀입니다.',
      address: '경기도 수원시 팔달구',
      state: CrawledRegion.GYEONGGI,
      url: 'https://blog.naver.com/crawled9002',
      platform: CrawledPlatform.NAVER,
    },
    credentials: [],
    posts: [
      {
        id: 3,
        memberId: 9002,
        title: '수원 영통 24평 실크도배',
        content: '이사 전 전체 도배.',
        images: img('crawled-post-3', 5),
        createdAt: EPOCH,
        modifiedAt: EPOCH,
      },
    ],
  },
  {
    id: 9003,
    company: '인천전기공사',
    name: '박민호',
    phone: '',
    picture: '',
    role: '기공',
    brn: '',
    email: '',
    createdAt: EPOCH,
    modifiedAt: EPOCH,
    profile: {
      primaryTrade: '전기',
      trades: ['전기'],
      experience: 8,
      headline: '조명·콘센트 증설, 누전 점검. 인천 전 지역.',
      about: '인천 지역 전기 시공 8년차입니다.',
      address: '',
      state: CrawledRegion.INCHEON,
      url: 'https://blog.naver.com/crawled9003',
      platform: CrawledPlatform.NAVER,
    },
    credentials: [],
    posts: [],
  },
]

const toSummary = ({
  posts: _posts,
  credentials: _credentials,
  ...rest
}: CrawledMember): CrawledMemberSummary => rest

export const crawledOverrides = [
  getGetCrawledMembersMockHandler(SEEDS.map(toSummary)),
  getGetCrawledMemberMockHandler((info) => {
    const id = Number(new URL(info.request.url).pathname.split('/').pop())
    return SEEDS.find((seed) => seed.id === id) ?? SEEDS[0]
  }),
]
