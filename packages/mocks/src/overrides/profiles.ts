import { getGetProfileMockHandler, getGetProfileResponseMock, Trade } from '@bconnect/api-client'

const HEADLINE = '안녕하세요, 타일 준기공 이송목입니다. 믿고 맡겨주신다면 성실히 임하겠습니다.'

const ABOUT = `안녕하세요, 타일 준기공 이송목입니다. 수입타일을 전문으로 시공하고 있습니다.
바닥, 벽면, 욕실 타일 모두 작업 가능하며, 줄눈 정밀도와 평탄 마감에 자신 있습니다.

시공문의
010-8335-8632
lsm3645@g.skku.edu

#타일 #수입타일 #욕실타일 #바닥타일`

export const profilesOverrides = [
  getGetProfileMockHandler(() => {
    const base = getGetProfileResponseMock()
    return {
      ...base,
      member: { ...base.member, username: 'leesongmok', name: '이송목' },
      profile: {
        ...base.profile,
        primaryTrade: Trade.TILING,
        experience: 3,
        headline: HEADLINE,
        about: ABOUT,
        address: { ...base.profile.address, city: '경기도' },
      },
    }
  }),
]
