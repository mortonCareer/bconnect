import {
  getGetFeedsMockHandler,
  ProfileRole,
  Role,
  TaskStatus,
  TaskType,
  Trade,
} from '@bconnect/api-client'
import type { Feed, Task } from '@bconnect/api-client'

interface FeedSeed {
  name: string
  trade: Trade
  experience: number
  headline: string
  content: string
  daysAgo: number
  imageCount: number
  /** 글에 연결된 시공사례 — 건축주명 + 시공일수. 없으면 카드 메타행에서 생략되는 경로 검증용 */
  task?: { company: string; days: number }
}

const FEED_SEEDS: FeedSeed[] = [
  {
    name: '서정건축',
    trade: Trade.WALLPAPER,
    experience: 7,
    headline: '도배 7년차, 합지·실크 꼼꼼 시공',
    content:
      '골프장 전원주택 도배 시공을 진행했습니다. 합지와 실크를 혼합해 결 방향까지 맞춰 마감했고, 모서리 들뜸 없이 깔끔하게 마무리했습니다.',
    daysAgo: 3,
    imageCount: 3,
    task: { company: '한울 종합건설', days: 4 },
  },
  {
    name: '김철수',
    trade: Trade.TILING,
    experience: 12,
    headline: '욕실·주방 타일 전문',
    content:
      '신축 아파트 32평 욕실 2개소 타일 시공을 마쳤습니다. 줄눈 간격을 균일하게 잡아 마감 평탄도를 살렸습니다.',
    daysAgo: 6,
    imageCount: 1,
    task: { company: '미소 인테리어', days: 2 },
  },
  {
    name: '박영희',
    trade: Trade.ELECTRICAL,
    experience: 17,
    headline: '전기 17년 경력',
    content: '상가 전기 배선 작업 마무리했습니다.',
    daysAgo: 10,
    imageCount: 2,
  },
  {
    name: '이준호',
    trade: Trade.DESIGN,
    experience: 9,
    headline: '카페·상업공간 인테리어 설계',
    content:
      '20평 카페 인테리어를 설계부터 시공 감리까지 한 번에 진행했습니다. 좁은 동선을 풀고 간접 조명 배치에 특히 신경 썼습니다.',
    daysAgo: 14,
    imageCount: 4,
    task: { company: '카페온 F&B', days: 12 },
  },
  {
    name: '최민수',
    trade: Trade.PAINTING,
    experience: 5,
    headline: '도장 5년',
    content: '외벽 도장 작업 완료.',
    daysAgo: 21,
    imageCount: 1,
  },
  {
    name: '정해성',
    trade: Trade.CARPENTRY,
    experience: 15,
    headline: '목공 15년, 원목 가구 제작',
    content:
      '원목 붙박이장을 제작해 설치했습니다. 무늬결을 맞춰 이어 붙여 한 판처럼 보이도록 작업했습니다.',
    daysAgo: 30,
    imageCount: 2,
    task: { company: '두손 건축사사무소', days: 1 },
  },
]

function daysAgoIso(days: number): string {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 19) + 'Z'
}

function taskOf(id: number, seed: FeedSeed): Task | null {
  if (!seed.task) return null
  const end = daysAgoIso(seed.daysAgo).slice(0, 10)
  const start = daysAgoIso(seed.daysAgo + seed.task.days - 1).slice(0, 10)
  const stamp = daysAgoIso(seed.daysAgo)
  return {
    id,
    type: TaskType.WORKER,
    status: TaskStatus.COMPLETED,
    trades: [seed.trade],
    start,
    end,
    workerId: null,
    workerTitle: null,
    workerMemo: null,
    workerCompany: seed.task.company,
    address: null,
    projectId: null,
    projectTitle: null,
    projectRequirement: null,
    projectMemo: null,
    offer: null,
    createdAt: stamp,
    modifiedAt: stamp,
  }
}

function buildImages(count: number): string[] {
  return Array.from(
    { length: count },
    (_, i) => `https://placehold.co/600x400/e5e5e5/767676?text=${i + 1}`
  )
}

export const feedsOverrides = [
  getGetFeedsMockHandler((): Feed[] =>
    // Feed = { member: MemberSummary, profile: ProfileSummary, post: Post, task: Task | null }.
    // ProfileSummary 엔 id/memberId/trades 없음(대표분야 primaryTrade 만) — mapper 도 대표분야 기준.
    FEED_SEEDS.map((seed, i): Feed => {
      const createdAt = daysAgoIso(seed.daysAgo)
      const task = taskOf(600 + i, seed)
      return {
        member: {
          id: 200 + i,
          username: `feed_user_${200 + i}`,
          name: seed.name,
          picture: null,
          role: Role.USER,
          createdAt,
          modifiedAt: createdAt,
        },
        profile: {
          role: ProfileRole.SKILLED,
          primaryTrade: seed.trade,
          experience: seed.experience,
          headline: seed.headline,
          address: {},
        },
        task,
        post: {
          id: 400 + i,
          memberId: 200 + i,
          taskId: task?.id ?? null,
          images: buildImages(seed.imageCount),
          content: seed.content,
          createdAt,
          modifiedAt: createdAt,
        },
      }
    })
  ),
]
