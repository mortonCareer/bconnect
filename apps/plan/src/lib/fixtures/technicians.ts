/**
 * 기술자 탐색 화면 fixture 데이터.
 *
 * TODO: BE #211 (별점/계약/인증/포트폴리오 등 derivative metrics) 구현 후 이 파일 삭제.
 *       useTechnicianItems 의 fixture import + 매핑 1줄을 generated 응답 매핑으로 복원.
 *
 * 6명 케이스 의도:
 *   1) 이송목  — Figma 시안 그대로 (경기도/타일/3년)
 *   2) 김철수  — 베테랑 + 자격 풍부 (서울/도배/10년)
 *   3) 박영희  — 다공종 중경력 (인천/전기·배관/7년)
 *   4) 신혜정  — 신입 + 인증·포트폴리오 없음 (강원/청소/0년)
 *   5) 정수진  — 헤드라인 매우 김 (line-clamp 검증, 대구/목공·단열/15년)
 *   6) 최민호  — 평범한 중간값 (부산/도장/1년)
 */
import { Trade } from '@bconnect/api-client'
import { TRADE_LABELS } from '@/lib/trade-labels'
import { getAvatarUrl } from '@/lib/avatar'
import type { TechnicianItem } from '@/hooks/useTechnicianItems'

const f = (
  profileId: number,
  name: string,
  location: string,
  trades: Trade[],
  experienceYears: number,
  headline: string,
  metrics: {
    rating: number
    reviewCount: number
    contractCount: number
    postCount: number
    coworkerCount: number
    recommendCount: number
    certifications: string[]
    portfolios: { imageUrl: string; daysRequired: number }[]
  }
): TechnicianItem => ({
  profileId,
  memberId: profileId,
  name,
  picture: getAvatarUrl(name),
  location,
  primaryTrade: TRADE_LABELS[trades[0]],
  experienceYears,
  headline,
  trades,
  ...metrics,
})

export const TECHNICIAN_FIXTURES: TechnicianItem[] = [
  f(
    1,
    '이송목',
    '경기도',
    // Figma 시안 매칭: '도배' selected, '타일' default (trades[0] 이 selected 로 렌더됨)
    [Trade.WALLPAPER, Trade.TILING],
    3,
    '안녕하세요, 타일 준기공 이송목입니다. 믿고 맡겨주신다면 성실히 임하겠습니다.',
    {
      rating: 4.3,
      reviewCount: 5,
      contractCount: 13,
      postCount: 7,
      coworkerCount: 13,
      recommendCount: 3,
      certifications: ['본인인증', '개인사업자', '경력증명(19.01~)'],
      portfolios: [
        { imageUrl: '', daysRequired: 3 },
        { imageUrl: '', daysRequired: 2 },
        { imageUrl: '', daysRequired: 4 },
      ],
    }
  ),
  f(2, '김철수', '서울', [Trade.WALLPAPER], 10, '도배 경력 10년. 깔끔한 마감 보장합니다.', {
    rating: 4.8,
    reviewCount: 28,
    contractCount: 64,
    postCount: 22,
    coworkerCount: 41,
    recommendCount: 12,
    certifications: ['본인인증', '개인사업자', '경력증명(14.03~)', '자격증'],
    portfolios: [
      { imageUrl: '', daysRequired: 1 },
      { imageUrl: '', daysRequired: 3 },
      { imageUrl: '', daysRequired: 2 },
    ],
  }),
  f(
    3,
    '박영희',
    '인천',
    [Trade.ELECTRICAL, Trade.PLUMBING],
    7,
    '전기·배관 동시 시공 가능. 견적 상담 환영합니다.',
    {
      rating: 4.5,
      reviewCount: 12,
      contractCount: 31,
      postCount: 14,
      coworkerCount: 22,
      recommendCount: 6,
      certifications: ['본인인증', '자격증'],
      portfolios: [
        { imageUrl: '', daysRequired: 2 },
        { imageUrl: '', daysRequired: 5 },
      ],
    }
  ),
  f(4, '신혜정', '강원', [Trade.CLEANING], 0, '', {
    rating: 0,
    reviewCount: 0,
    contractCount: 0,
    postCount: 0,
    coworkerCount: 0,
    recommendCount: 0,
    certifications: [],
    portfolios: [],
  }),
  f(
    5,
    '정수진',
    '대구',
    [Trade.CARPENTRY, Trade.INSULATION],
    15,
    '15년 경력 목공 반장입니다. 인테리어 전반(목공·단열·마감) 한 번에 가능하고, 까다로운 현장도 자신 있습니다. 견적은 무료로 드리니 부담 없이 연락 주세요.',
    {
      rating: 4.9,
      reviewCount: 45,
      contractCount: 102,
      postCount: 38,
      coworkerCount: 67,
      recommendCount: 24,
      certifications: ['본인인증', '개인사업자', '경력증명(09.05~)', '자격증', '추천서'],
      portfolios: [
        { imageUrl: '', daysRequired: 4 },
        { imageUrl: '', daysRequired: 3 },
        { imageUrl: '', daysRequired: 5 },
      ],
    }
  ),
  f(6, '최민호', '부산', [Trade.PAINTING], 1, '꼼꼼한 도장 시공. 작은 현장도 환영합니다.', {
    rating: 3.8,
    reviewCount: 2,
    contractCount: 3,
    postCount: 1,
    coworkerCount: 4,
    recommendCount: 0,
    certifications: ['본인인증'],
    portfolios: [{ imageUrl: '', daysRequired: 2 }],
  }),
]
