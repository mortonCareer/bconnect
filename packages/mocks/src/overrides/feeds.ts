import {
  AttachmentType,
  getGetFeedsMockHandler,
  TaskProgress,
  TaskStatus,
  TaskType,
} from '@bconnect/api-client'
import type { Attachment, CursorPageFeed, Feed, Task, Trade } from '@bconnect/api-client'
import { addressOf } from './_address'
import { PROFILE_SEEDS, type ProfileSeed } from './profiles'

interface FeedSeed {
  /** 작성자 — profiles.ts PROFILE_SEEDS 의 id. 목록·프로필 패널과 같은 회원이어야 작업물이 매칭된다 */
  memberId: number
  content: string
  daysAgo: number
  imageCount: number
  /** 글에 연결된 시공사례 — 건축주명 + 시공일수. 없으면 카드 메타행에서 생략되는 경로 검증용 */
  task?: { company: string; days: number }
}

const FEED_SEEDS: FeedSeed[] = [
  // 이송목(타일) — 사진 4장 + 12일 소요
  {
    memberId: 1,
    content:
      '20평 카페 바닥과 아트월 타일을 시공했습니다. 패턴 이음을 맞추느라 재단에 시간을 들였고, 줄눈은 무광 그레이로 통일했습니다.',
    daysAgo: 3,
    imageCount: 4,
    task: { company: '카페온 F&B', days: 12 },
  },
  // 이송목(타일) — 사진 1장 + 작업 미연결(메타행 생략 경로)
  {
    memberId: 1,
    content: '상가 화장실 바닥 타일을 부분 보수했습니다.',
    daysAgo: 21,
    imageCount: 1,
  },
  // 이송목(도배) — 사진 3장 + 4일 소요
  {
    memberId: 101,
    content:
      '골프장 전원주택 도배 시공을 진행했습니다. 합지와 실크를 혼합해 결 방향까지 맞춰 마감했고, 모서리 들뜸 없이 깔끔하게 마무리했습니다.',
    daysAgo: 6,
    imageCount: 3,
    task: { company: '한울 종합건설', days: 4 },
  },
  // 이송목(도배) — 사진 2장 + 1일 소요(당일 작업 경계값)
  {
    memberId: 101,
    content:
      '원룸 전체 도배를 하루 만에 마감했습니다. 이사 일정에 맞춰 오전에 걷어내고 오후에 새로 붙였습니다.',
    daysAgo: 30,
    imageCount: 2,
    task: { company: '두손 건축사사무소', days: 1 },
  },
  // 박전기(전기) — 사진 2장 + 작업 미연결
  {
    memberId: 102,
    content: '상가 전기 배선 작업 마무리했습니다.',
    daysAgo: 10,
    imageCount: 2,
  },
  // 최타일(타일) — 사진 1장 + 2일 소요
  {
    memberId: 103,
    content:
      '신축 아파트 32평 욕실 2개소 타일 시공을 마쳤습니다. 줄눈 간격을 균일하게 잡아 마감 평탄도를 살렸습니다.',
    daysAgo: 14,
    imageCount: 1,
    task: { company: '미소 인테리어', days: 2 },
  },
]

function daysAgoIso(days: number): string {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 19) + 'Z'
}

function authorOf(memberId: number): ProfileSeed {
  const seed = PROFILE_SEEDS.find((p) => p.id === memberId)
  if (!seed) throw new Error(`feeds mock: profiles.ts 에 없는 memberId ${memberId}`)
  return seed
}

function taskOf(id: number, seed: FeedSeed, trade: Trade): Task | null {
  if (!seed.task) return null
  const end = daysAgoIso(seed.daysAgo).slice(0, 10)
  const start = daysAgoIso(seed.daysAgo + seed.task.days - 1).slice(0, 10)
  const stamp = daysAgoIso(seed.daysAgo)
  return {
    id,
    type: TaskType.WORKER,
    status: TaskStatus.ASSIGNED,
    progress: TaskProgress.COMPLETED,
    trades: [trade],
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
    projectCompanyId: null,
    projectCompanyName: null,
    offer: null,
    createdAt: stamp,
    modifiedAt: stamp,
  }
}

function buildAttachments(
  count: number,
  postId: number,
  memberId: number,
  stamp: string
): Attachment[] {
  return Array.from({ length: count }, (_, i) => ({
    id: postId * 10 + i + 1,
    memberId,
    type: AttachmentType.IMAGE,
    filename: `work-${i + 1}.png`,
    contentType: 'image/png',
    size: 120_000,
    createdAt: stamp,
    modifiedAt: stamp,
    url: `https://placehold.co/600x400/e5e5e5/767676?text=${i + 1}`,
  }))
}

export const feedsOverrides = [
  getGetFeedsMockHandler(
    (): CursorPageFeed => ({
      // Feed = { member: MemberSummary, profile: ProfileSummary, post: Post, task: Task | null }.
      // ProfileSummary 엔 id/memberId/trades 없음(대표분야 primaryTrade 만) — mapper 도 대표분야 기준.
      content: FEED_SEEDS.map((seed, i): Feed => {
        const author = authorOf(seed.memberId)
        const createdAt = daysAgoIso(seed.daysAgo)
        const task = taskOf(600 + i, seed, author.trade)
        return {
          member: {
            id: author.id,
            username: author.username,
            name: author.name,
            picture: null,
          },
          profile: {
            role: author.role,
            primaryTrade: author.trade,
            experience: author.experience,
            headline: author.headline,
            address: addressOf(author.state, author.city),
          },
          task,
          post: {
            id: 400 + i,
            memberId: author.id,
            taskId: task?.id ?? null,
            attachments: buildAttachments(seed.imageCount, 400 + i, author.id, createdAt),
            content: seed.content,
            createdAt,
            modifiedAt: createdAt,
          },
        }
      }),
      hasNext: false,
      nextCursor: undefined,
    })
  ),
]
