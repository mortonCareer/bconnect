import {
  CoworkerStatus,
  getGetMyProfileMockHandler,
  getGetProfileMockHandler,
  getGetProfilesMockHandler,
  ProfileRole,
  Role,
  Trade,
} from '@bconnect/api-client'
import type { MemberSummary, Profile, ProfileDetail } from '@bconnect/api-client'

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
  picture: null,
  role: Role.USER,
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
  // 주소 저장 규칙(mapKakaoAddress) — state = 시/도, district = 시/군/구(Address.city)
  state: string
  district: string
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
    state: '경기도',
    district: '수원시 장안구',
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
    state: '경기도',
    district: '용인시 기흥구',
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
    state: '서울특별시',
    district: '강남구',
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
    state: '인천광역시',
    district: '남동구',
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
    city: seed.district,
    state: seed.state,
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

// 타인 프로필 단건 조회는 조회자 기준 품앗이꾼 상태가 실린 ProfileDetail 로 응답
const detailOf = (seed: ProfileSeed): ProfileDetail => ({
  ...profileOf(seed),
  status: CoworkerStatus.NONE,
})

const PROFILES_BY_ID: Record<number, ProfileDetail> = Object.fromEntries(
  SEEDS.map((seed) => [seed.id, detailOf(seed)])
)

// #966 프로필 이미지 업로드 QA — mock-s3 는 바이트를 버리므로 pictureId 시드 이미지로 교체 표시.
// members.ts 의 updateMyMemberPicture override 가 호출 (프로필 도메인 state 단일 owner 유지).
// getMyProfile 이 매 호출 seed 에서 새 객체를 만들므로 변이 대신 모듈 변수로 보관해 응답 시 주입.
let myMockPicture: string | null = null

export function setMyMockPicture(pictureId: number) {
  myMockPicture = `https://picsum.photos/seed/bconnect-${pictureId}/200/200`
  const me = PROFILES_BY_ID[1]?.member
  if (me) me.picture = myMockPicture
}

const withMyPicture = (profile: Profile): Profile =>
  myMockPicture && profile.member
    ? { ...profile, member: { ...profile.member, picture: myMockPicture } }
    : profile

const paramId = (value: string | readonly string[] | undefined): number =>
  Number(typeof value === 'string' ? value : (value?.[0] ?? ''))

export const profilesOverrides = [
  getGetProfilesMockHandler(() => SEEDS.map((seed) => profileOf(seed))),
  // /profiles/me 는 status 없는 평문 Profile — 타인 조회(ProfileDetail)와 응답형이 다르다
  getGetMyProfileMockHandler(() => withMyPicture(profileOf(SEEDS[0]))),
  getGetProfileMockHandler(({ params }) => PROFILES_BY_ID[paramId(params.id)] ?? PROFILES_BY_ID[1]),
]
