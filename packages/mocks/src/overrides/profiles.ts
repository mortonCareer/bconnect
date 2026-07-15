import {
  getGetMyProfileMockHandler,
  getGetProfileMockHandler,
  getGetProfilesMockHandler,
  ProfileRole,
  Trade,
} from '@bconnect/api-client'
import type { MemberSummary, Profile } from '@bconnect/api-client'

// 프로필 도메인 단일 owner — getProfile(/profiles/:id) 을 id 로 keying,
// getMyProfile(/profiles/me, 내 프로필 화면)은 id 1 seed 반환,
// getProfiles(목록, plan 기술자 탐색)는 전체 seed 반환.
// id 1 = 본인(getMyMember 와 동일 식별자, 자기 프로필 화면용 리치 데이터).
// id 101~103 = chats.ts 채팅 상대 — 상대 프로필 열람 시 일관 표시.
// BE 확정 시 generated handler 로 교체. dev/preview 전용(prod tree-shake).

const EPOCH = '2025-01-02T00:00:00.000Z'

const HEADLINE = '안녕하세요, 타일 준기공 이송목입니다. 믿고 맡겨주신다면 성실히 임하겠습니다.'

const ABOUT = `안녕하세요, 타일 준기공 이송목입니다. 수입타일을 전문으로 시공하고 있습니다.
바닥, 벽면, 욕실 타일 모두 작업 가능하며, 줄눈 정밀도와 평탄 마감에 자신 있습니다.

시공문의
010-8335-8632
lsm3645@g.skku.edu

#타일 #수입타일 #욕실타일 #바닥타일`

const memberOf = (id: number, username: string, name: string): MemberSummary => ({
  id,
  username,
  name,
  createdAt: EPOCH,
  modifiedAt: EPOCH,
})

interface ProfileSeed {
  id: number
  username: string
  name: string
  role: ProfileRole
  trade: Trade
  experience: number
  headline: string
  about: string
  city: string
}

const SEEDS: ProfileSeed[] = [
  {
    id: 1,
    username: 'leesongmok',
    name: '이송목',
    role: ProfileRole.SEMI_SKILLED,
    trade: Trade.TILING,
    experience: 3,
    headline: HEADLINE,
    about: ABOUT,
    city: '경기도',
  },
  {
    id: 101,
    username: 'worker_101',
    name: '이송목',
    role: ProfileRole.SEMI_SKILLED,
    trade: Trade.WALLPAPER,
    experience: 8,
    headline: '도배 준기공',
    about: '안녕하세요, 도배 준기공 이송목입니다.\n믿고 맡겨주신다면 성실히 임하겠습니다.',
    city: '경기도',
  },
  {
    id: 102,
    username: 'worker_102',
    name: '박전기',
    role: ProfileRole.SKILLED,
    trade: Trade.ELECTRICAL,
    experience: 12,
    headline: '전기 기공',
    about: '전기 공사 12년 경력입니다.\n현장 안전 최우선으로 작업합니다.',
    city: '서울특별시',
  },
  {
    id: 103,
    username: 'worker_103',
    name: '최타일',
    role: ProfileRole.FOREMAN,
    trade: Trade.TILING,
    experience: 5,
    headline: '타일 시공',
    about: '타일·방수 전문입니다.\n견적 문의 편하게 주세요.',
    city: '인천광역시',
  },
]

const profileOf = (seed: ProfileSeed): Profile => ({
  id: seed.id,
  member: memberOf(seed.id, seed.username, seed.name),
  role: seed.role,
  primaryTrade: seed.trade,
  trades: [seed.trade],
  experience: seed.experience,
  headline: seed.headline,
  about: seed.about,
  address: {
    zipcode: '00000',
    city: seed.city,
    state: seed.city,
    street: '○○로 12',
    latitude: 37.5,
    longitude: 127.0,
  },
  postCount: 0,
  recommendationCount: 0,
  coworkerCount: 0,
  createdAt: EPOCH,
  modifiedAt: EPOCH,
})

const PROFILES_BY_ID: Record<number, Profile> = Object.fromEntries(
  SEEDS.map((seed) => [seed.id, profileOf(seed)])
)

const paramId = (value: string | readonly string[] | undefined): number =>
  Number(typeof value === 'string' ? value : (value?.[0] ?? ''))

export const profilesOverrides = [
  getGetProfilesMockHandler(() => SEEDS.map((seed) => profileOf(seed))),
  getGetMyProfileMockHandler(() => PROFILES_BY_ID[1]),
  getGetProfileMockHandler(({ params }) => PROFILES_BY_ID[paramId(params.id)] ?? PROFILES_BY_ID[1]),
]
