import { getGetCrawledMembersMockHandler, CrawledPlatform, Region } from '@bconnect/api-client'
import type {
  CrawledMember,
  CrawledMemberSummary,
  CrawledPost,
  CursorPageCrawledMemberSummary,
} from '@bconnect/api-client'
import { http, HttpResponse } from 'msw'

// 크롤링 기술자 — plan 기술자 탐색 병합 노출용 시드.
// #826 크롤러 dry-run 실측 데이터에서 발췌 (네이버 CDN 실사진 → no-referrer 렌더 경로까지 로컬 검증).
// 연락처·사업자번호·이메일은 개인정보라 가짜 값으로 치환, 본문 내 전화번호도 마스킹돼 있다.
// trades 는 BE 원본과 동일하게 한국어 라벨 문자열 (FE 가 Trade enum 으로 역매핑).

const EPOCH = '2025-01-02T00:00:00.000Z'

type RawPost = Omit<CrawledPost, 'taskId' | 'task'>
type RawMember = Omit<CrawledMember, 'posts'> & { posts: RawPost[] }

const RAW: RawMember[] = [
  {
    id: 9001,
    company: '집수리랜드',
    name: '임현택',
    phone: '01000000001',
    picture:
      'https://blogfiles.pstatic.net/MjAyNDA4MTJfMTEz/MDAxNzIzNDYzNTgzODUy.VsX8tUvEeurfO9c8jZI7oT8Zvuiw_KtiJqA3XkDLTYYg.ZE17PdezQzTV4Gz4qnGvK2tspKNB5CY-LMYgydHD-gkg.PNG/%EC%A7%91%EC%88%98%EB%A6%AC%EB%9E%9C%EB%93%9C-%ED%83%80%EC%9D%B4%ED%8B%80-001.png/title?type=f966_600_q70',
    role: '',
    brn: '',
    email: '',
    createdAt: EPOCH,
    modifiedAt: EPOCH,
    profile: {
      primaryTrade: 'TILING',
      trades: ['TILING'],
      experience: null,
      headline:
        '우리집에 관련된 각종 수리, 보수, 교체, 설치를 도와드리고 있습니다. 앞으로 꾸준히 집수리에 관련된 자료를 업데이트 할 예정입니다.',
      address: '남양주시 화도읍 녹촌로9 101-601',
      state: Region.서울,
      url: 'https://blog.naver.com/jamdoong',
      platform: CrawledPlatform.NAVER,
    },
    credentials: [],
    posts: [
      {
        id: 1,
        memberId: 9001,
        title: '욕실 금가고 들뜬 벽타일 부분보수 비용 송파구 타일 시공 업체',
        content:
          '안녕하세요~\n타일 부분보수\n전문업체\n집수리 랜드입니다.\n재사용 타일 수리\n덧방타일 하자 보수\n타일 파손 부분수리\n타일 재시공 등\n타일 시공과 관련된\n모든 작업을 진행합니다.\n서울, 경기, 인천 등\n수도권 전 지역 출장 가능합니다.\n견적문의는 언제든지 OK입니다.\n통화부재시\n문자로 사진과 작업내용\n부탁드립니다\n관련글 보기\n작업내용 미리보기\n몇일 전 욕실 금가고 들뜬 벽타일 부분보수 비용 문의를 주셔서 송파구 타일 시공을 진행한 고객님댁 현장 사례입니다.\n이 현장은 보수할 타일의 위치가 해바라기샤워 앞이였는데요 금이가기 시작하면서 들뜸',
        images: [
          'https://postfiles.pstatic.net/MjAyNjAzMDRfMjEx/MDAxNzcyNTYyMTkyODMx.zFGzbSzpNeboaAe-TY0lmIJBne-VOB4paIcY-IPshJIg.xv9CGPm1iRfetVPZnHB0Ufu3kuw6uma8yfw6NcdsJ4kg.JPEG/20251101_134334(0)123.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjAzMDRfMjIx/MDAxNzcyNTY2NzA2Nzk5.LefAVENK30N4itdxFQZ18pDhoo6lm_XVLFlODxstqnUg.IYA-OHjvuVgBZ3DPrOjrgqlyOHb27-MPCVkUcjxRdHIg.JPEG/20251101_103456(0)123.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjAzMDRfMTUw/MDAxNzcyNTY2NzA2NzY3.sqv4cZrHGco-noVFGV3CfJfpLOKNUhsGLqGxU9bW3cwg.TnWzHX7H0s9MAmwAkHfl6Oz0rpXNrQid-LbQh8bRdIAg.JPEG/20251101_134334(0)23.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjAzMDRfMjk3/MDAxNzcyNTY2NDUyNTE0.c3uACe9HyaWGMLUEgUFIyMNIkwLkYWFSexe5VPCikSsg.P72nwBErMSFcoIG6wH_A9f_-UCgioWuJ11BF4eNVn84g.JPEG/20251101_103453(0).jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjAzMDRfMTU4/MDAxNzcyNTY2NDUyNDk1.b7HvMaZ7ksXtxn6_69HFrVCdRnxTibpgHqYrrELdboEg.YIVdmbFcPaJwtKallMCZbgiG_W_SC7U4yEkGi6Jvh8gg.JPEG/20251101_103448.jpg?type=w966',
        ],
        sourceUrl: 'https://blog.naver.com/jamdoong/223000000001',
        createdAt: EPOCH,
        modifiedAt: EPOCH,
      },
      {
        id: 2,
        memberId: 9001,
        title: '변기 바닥 실리콘 보수 백시멘트 금가고 흔들림 수리',
        content:
          '안녕하세요. 집수리랜드입니다.\n변기 바닥 백시멘트가 금가고 흔들리는 경우 무시하고 계속 사용을 할 경우 변기 아래 플렌지가 깨지면서 악취까지 발생할 수 있습니다.\n재빠르게 보수를 추천드리는데요. 이 번 현장의 경우 기존 백시멘트를 제거하고 실리콘으로 재시공을 원하셨습니다.\n시공 과정과 주의사항 등을 확인해보시면 좋겠습니다.\n서울, 경기, 인천 등\n전 지역 출장 가능합니다.\n비용 문의는 언제든지 OK입니다.\n관련글 보기\n작업내용 미리보기\n시공전과 시공후 비교사진\n위 시공전 사진을 보면 변기 바닥 백시멘트가 금이 가있는 상태인데요. 고',
        images: [
          'https://postfiles.pstatic.net/MjAyNjA3MDRfMTAy/MDAxNzgzMTEwNjQ5OTAz.mcaAahDuz1iBh4K1j677LtT-Ay6rCoIigivZT6JYlxMg.NhZ70KqKJVwFdafHDjogEj1_t2ZosnCH2T1u9dqb1BUg.JPEG/20251226_153151232.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDRfNTMg/MDAxNzgzMTE0NTkzMzIy.RqsamU6b7FCP8S1rF0GM0dR6xZvdbICjyx189MDMIkAg.vW3iKfcN8XF2-PEXEr-y1CpKZ39E-6GRqlEWlt0y1l0g.JPEG/20251226_15024523.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDRfMjQz/MDAxNzgzMTE0NTkzNTE0.IDpmwJqfGIf_7oQQd5VZJGsNQ0Kd__6i0ainTV0BmWMg.q3BPPOm320NOVxt6oQxrZrS0RM5UyecEN43upQdx7xsg.JPEG/20251226_153151232123.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDRfMjQ5/MDAxNzgzMTEyOTg5ODA4.VMpL6OvGfD8YnC4Tki9uWU73FwhJSuIJwHjT_sNrSvgg.Y-ORbBz_LFnpcwAEidAtBHX65tMHrKo5-CYkyEmq--Mg.JPEG/20251226_150245.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDRfMjEw/MDAxNzgzMTEyOTg5Njcz.u1SsRJ-CsiacOtTlN6FBu6J6tA1fYMD849fTV5Og4nQg.SlDiwM3_eKs0tOmQ5YuIdYiDzAqHroTsuweyDz98q8Eg.JPEG/20251226_150300.jpg?type=w966',
        ],
        sourceUrl: 'https://blog.naver.com/jamdoong/223000000002',
        createdAt: EPOCH,
        modifiedAt: EPOCH,
      },
      {
        id: 3,
        memberId: 9001,
        title: '욕조 실리콘 벌어짐 보수 틈새 누수 재시공 작업',
        content:
          '안녕하세요. 집수리랜드입니다.\n구옥 아파트나 빌라의 경우 욕조 테두리 실리콘이 벌어지거나 들떠있는 경우가 많습니다.\n이 번 현장은\n실리콘이 벌어지면서 아래층으로 누수까지 벌어졌던 곳\n입니다. 누수로 인해서 굉장히 급하게 재코킹 요청을 해주셔서 다녀왔습니다.\n서울, 경기, 인천 등\n전 지역 출장 가능합니다.\n비용 문의는 언제든지 OK입니다.\n관련글 보기\n작업내용 미리보기\n시공 전과 시공 후의 상태 비교\n위 시공전 사진을 보시면 실리콘이 많이 벌어져있는 것을 확인할 수 있습니다. 벌어진\n틈으로 누수가 발생\n하고 있었고요.\n곰팡이 항균 ',
        images: [
          'https://postfiles.pstatic.net/MjAyNjA2MjZfMTYz/MDAxNzgyNDIzNDQxNTAx.M5lUlUmF_zktgQVMLoe7Y0UZNZNzjiVI-SQPlVQoUO0g.LMeWFax4OerM0X_BVnpATBRZ95AFqSeg45612grJR8gg.JPEG/20260214_150058232.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA2MjdfMjY1/MDAxNzgyNTMzMDM5NTA4.aSoCjdtRYKeTJS6e9eJa9ubzYNKjPVefoAatxeNjeEsg.vtQahOoQxWBe_8a5f8uOa0GO5Wnhe8Kv9ijO7srEpxgg.JPEG/20260214_132803232.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA2MjdfMjI2/MDAxNzgyNTMzMDM5NjE4.Xab0L1WCA3nWlSxTe93PnFGTM8-dtK4PV04Jrebh6rUg.R_YZSghqBO51SDnN3O057dUSyxLHyWh8JIVtiViWibwg.JPEG/20260214_150107(0)23.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA2MjdfMjMz/MDAxNzgyNTMyNTA1MTg5.RnRBQzhEpSPZxxRW9hbMdUW2UefnS0A2jEo8O86sc8gg.1kBxoS4t7dwSJDff3HZp7-vImmTIWSaqtu4jGxRgB9Ig.JPEG/20260214_132827(4).jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA2MjdfMTgy/MDAxNzgyNTMyNTA1MDU2.uJ58pA3XUzFF5fICZ6FyN8j1msh8AKy1G0_ubEdpj_wg.DMb0-N9c5_f1SB7pW-pnlgYB7HCqFl7UILl7I1BKkckg.JPEG/20260214_132803.jpg?type=w966',
        ],
        sourceUrl: 'https://blog.naver.com/jamdoong/223000000003',
        createdAt: EPOCH,
        modifiedAt: EPOCH,
      },
    ],
  },
  {
    id: 9002,
    company: '장스타일',
    name: '',
    phone: '01000000002',
    picture:
      'https://blogfiles.pstatic.net/MjAyNTAzMjNfMjc3/MDAxNzQyNzQxNTc5OTUy.9dfMuIjYP5YCu29OHYvm_JQpAB1IYtxKRcSU4L6zytUg.0pCGkPS5w_WztC2t5Jt6EjEsCzfDpEon_7J_LWIdKW8g.JPEG/aa.jpg/title?type=f966_600_q70',
    role: '',
    brn: '',
    email: '',
    createdAt: EPOCH,
    modifiedAt: EPOCH,
    profile: {
      primaryTrade: 'TILING',
      trades: ['TILING', 'PLASTERING'],
      experience: null,
      headline:
        'TEL 010-0000-0000 타일하자보수/미장단차/각종수전/도기설치  24시간 365일 주말 공휴일 친철히 상담가능. 국가기술자격번호 ***031108*** 사업자등록번호 @30017@@@ 카드결제/현금영수증',
      address: '경기도 수원시 영통구 덕영대로 1410',
      state: Region.경기,
      url: 'https://blog.naver.com/hobbyreview',
      platform: CrawledPlatform.NAVER,
    },
    credentials: [],
    posts: [
      {
        id: 11,
        memberId: 9002,
        title: '수원타일시공업체 화장실 미끄럼방지 논슬립 바닥 영통아이파크캐슬',
        content:
          '화장실은 물을 많이 사용하는 장소입니다.\n구축 아파트의 경우 바닥이 미끄러운\n타일로 이루어져 있어 낙상 사고로\n이어질 수 있는 경우가 많습니다.\n이번 현장은 화려하고 미끄러운 욕실 바닥을\n논슬립으로 교체하여\n사고를 예방하고 깔끔한 디자인으로\n변경해드린 현장입니다.\n공인타일시공자격취득\n사업자등록업체\n장스타일입니다~\n수원타일시공업체 화장실 미끄럼방지\n논슬립 바닥 영통아이파크캐슬\n영통아이파크캐슬1단지\n경기도 수원시 영통구 덕영대로 1410\n수원시 영통구에 위치한\n영통아이파크캐슬1단지 아파트 현장입니다.\n화려하고 미끄러운 금장타일\n수원 화',
        images: [
          'https://postfiles.pstatic.net/MjAyNjA2MDdfMjQx/MDAxNzgwODI4NDczMDE2.hpluEA6RCXxQg428vEyFbWDZkqAv46Gb0OQ4ZP-BqXsg.4HyLZI0ihKR4nd3QbLR6CaJ036ItsfPOTzCGxrMt1fwg.JPEG/20260508_084647.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA2MDdfMTgw/MDAxNzgwODI4NDczMDU0.G7EInRn9OAbKq33AdBNJ8D9lWpNhsCirhLq_E72huLIg.ArM_Ep6DyvGzaTfuCKlM-o1BTjKZVHsoI9TBWXx4dTQg.JPEG/20260508_084650.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA2MDdfMTk3/MDAxNzgwODI4NzA5NjM2.MemRDnXP0V8gyk3lQmjlLU4tVuL_OUSJXvp0YDAIgCwg.2BANj_YB5tIlPYae_ZCbTbILjQtxTFqMlKRnuQYY7xIg.JPEG/20260508_084700.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA2MDdfNjcg/MDAxNzgwODI4NzA5NjI3.ChOqPuZk8EtSNFwFrKUU4FpDNrmHLtkuf9AWfvDug1Qg.hLVCywAaDG-oSYUpYtmvfwK-JolBdgziu9lVzBuxlrwg.JPEG/20260508_084657.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA2MDdfMjQg/MDAxNzgwODI5MDI4MDcy.Qr4d-nhSaGZkYx5raW813w7__3inaGLPufxak7kA6pgg.9hURPpwi8UbLKalP86vP7hSZvMi3XpsuVk6cpbsLcf0g.JPEG/20260508_100702.jpg?type=w966',
        ],
        sourceUrl: 'https://blog.naver.com/hobbyreview/223000000011',
        createdAt: EPOCH,
        modifiedAt: EPOCH,
      },
      {
        id: 12,
        memberId: 9002,
        title: '수원타일수리 오피스텔 화장실 욕실 타일 깨짐 부분 교체 수원역센트럴시티뷰',
        content:
          '수원타일시공보수전문업체\n정식사업자등록\n카드결제, 현금영수증 가능\n국가공인타일시공자격취득\n장스타일입니다.\n수원타일수리 오피스텔 화장실 욕실 타일 깨짐 부분 교체 수원역센트럴시티뷰\n욕실벽면에 문제가 생긴 경우\n아래 링크를 통해 정확한 하자범위를 확인\n정확한 견적이 가능합니다.\nhttps://blog.naver.com/hobbyreview/223010-0000-0000\n수원역센트럴시티뷰\n경기도 수원시 팔달구 갓매산로 66\n수원시에 위치한\n수원역센트럴시티뷰 오피스텔\n타일하자보수 시공 후기 입니다.\n생각보다 넓은 시공 범위\n욕실장 옆 벽면에',
        images: [
          'https://postfiles.pstatic.net/MjAyNjA3MDlfMjk4/MDAxNzgzNTk5NTk1MzEy.2qsCNIUoPktw7veXVBtYSE5jhfX89eO6GPYDxGbfgvkg.GhCwsl63gFUBTXiYCjxN96zcOwRRMBWcmB6-QK3n8UAg.JPEG/20231218_094846.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDlfMTEg/MDAxNzgzNTk5NjU5MTg1.S_WrobwLYq-JKGvy5OZKBQOXpVpLl8kSqhvdBYb_Zmwg.TssU2fs8Qk_9tq3YfSsZg4Flxm44oef2p7gdDn1fIVkg.JPEG/20231218_094842.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDlfODgg/MDAxNzgzNTk5NzE3MTEw.A6gSJG66Ia_B15yEUrEwkz7o6Ib9oibho3vL2KEgGp8g.VNz-DXThneyXRPR_PcdqBw3uuwyTBppsjAOAjZHROaIg.JPEG/20231218_094849.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDlfMTQ0/MDAxNzgzNTk5NzgyMjQx.o7msQZHjTPW5OE0PHNCALOFsIPWF-Qa8mncN9UFNJ4Eg.4pnDgAf8I1m-5ZQ_zNMvqRl9p9-469xeAM3fpOhXCUEg.JPEG/20231218_095831.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDlfMzAg/MDAxNzgzNTk5OTU1OTc4.8uLd7udsFP1DevpDoZ-z0_fPYzIGX1tJxfTBkoFoAicg.YdoXyHx4GbloKEU1QcajqA2Fo9tbLwjMioic1L3XsyEg.JPEG/20231218_113254(0).jpg?type=w966',
        ],
        sourceUrl: 'https://blog.naver.com/hobbyreview/223000000012',
        createdAt: EPOCH,
        modifiedAt: EPOCH,
      },
      {
        id: 13,
        memberId: 9002,
        title: '동탄하자보수 욕조 실리콘 오염 곰팡이 변색 갈라짐 교체 재시공 센트럴힐즈',
        content:
          '욕조 실리콘이 벌어진 상태로\n계속 사용하게 되면\n지속적인 물 유입으로 누수의 위험까지\n커지게 됩니다.\n욕조 실리콘은 물 유입을 방지하는 기능과\n욕조 자체를 고정하는 역활을 하기 때문에\n지속적인 관리와 관심이 필요합니다.\n동탄하자보수 욕조 실리콘 오염 곰팡이\n변색 갈라짐 교체 재시공 센트럴힐즈\n화성동탄2센트럴힐즈동탄\n경기도 화성시 동탄구 동탄대로12길 71\n이번 포스팅은 욕조 실리콘 오염과\n갈라짐 현상으로 셀프 교체를 시도하셨으나\n실패하셔서 도움을 요청주신 현장입니다.\n화성동탄2센트럴힐즈동탄 시공 사례를\n소개해 드리겠습니다~\n실리콘 ',
        images: [
          'https://postfiles.pstatic.net/MjAyNjA3MDZfMTE2/MDAxNzgzMzQwOTI4ODU2.VEx3vUcVUgeHrp2bfs4x8rdw6dyihxFSFRsIDDwfWa8g.7WeoEyvpzGZgU-APtBczHO4Ffilm6xNlXsrwlUcmiIQg.JPEG/20260118_161859.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDZfMTk5/MDAxNzgzMzQxMDI3MzQ4.0rocFONA0PQ6j8wh27CKchjnmr8vsC_ZWe2VEbEXnSAg.5j08kDEQTkyOplQshocKYBdeUyOp6MOQuJMDgA512ckg.JPEG/20260118_161907.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDZfMjMg/MDAxNzgzMzQxMTI1NzMx.wwE31etzYOgEeJ3n8fu8IVMxGwt5tX6fUoUN2c9YH4cg.GDMMOZ-60OgNiKd4ZhbwUiwXHnOW57v0u57JXLeY_nYg.JPEG/20260118_161914.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDZfMSAg/MDAxNzgzMzQxMDI3MzQ1.LXnZmrmQIofNDm1EEMGNpBML4yn7EqJ77J-KmsyAJE8g._shVVpZe4eL0wYVib57Iv8_pF9nxheH87oNYtXfD5sYg.JPEG/20260118_161903.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDZfODUg/MDAxNzgzMzQwOTI4ODg3.c_DFOAv5x-7XJ3_1Pq8b2z97gM-EZs0mAbfd7a-t9Wog.Tnvf8Og_oWx18lwrY_TfWymIe3LIwh337fdogDBACBsg.JPEG/20260118_161901.jpg?type=w966',
        ],
        sourceUrl: 'https://blog.naver.com/hobbyreview/223000000013',
        createdAt: EPOCH,
        modifiedAt: EPOCH,
      },
    ],
  },
  {
    id: 9003,
    company: '프로홈픽서',
    name: '',
    phone: '01000000003',
    picture:
      'https://blogfiles.pstatic.net/MjAyMzA5MTZfMjY4/MDAxNjk0ODQ3MjcxMTYw.6lSXLrRnPjPYMER1CL_c2wWXWb4stEfxuE0iXTe7TKog.wLIHpp4mCjN1xd1NlTfnp998wZkZB24aUxxK0Z2hkQEg.JPEG.eui6212/%EB%B8%94%EB%A1%9C%EA%B7%B8%ED%83%80%EC%9D%B4%ED%8B%80.jpg/backtop?type=w3000',
    role: '',
    brn: '',
    email: '',
    createdAt: EPOCH,
    modifiedAt: EPOCH,
    profile: {
      primaryTrade: 'TILING',
      trades: ['TILING', 'SINK'],
      experience: 1,
      headline:
        'tel:010-0000-0000\nKBS 동행 프로그램 출연-1인창업-타일-대리석-싱크대-거실 폴리싱 타일-아트월 타일-욕실-부분수리-부분교체집수리 출장지역(서울 인천 경기전지역 빠른출동/충남 충북 강원 출동) 1,500건 이상의 다양한 집수리 경력',
      address: '',
      state: Region.경기,
      url: 'https://blog.naver.com/eui6212',
      platform: CrawledPlatform.NAVER,
    },
    credentials: [],
    posts: [
      {
        id: 21,
        memberId: 9003,
        title: '수지 타일 시공 업체 욕실 안쪽이 터졌어요',
        content:
          '안녕하세요~\n반갑습니다^^\n수지 타일 시공 업체\n프로홈픽서\n입니다.\n5월의 마지막 주가 시작되었어요!\n석가탄신일 휴일 덕분에\n가족과 함께하는 시간이 더 길어졌어요.\n이렇게 함께하는 시간이 많아지니까\n우리 집이 더 소중하게 느껴지네요.\n오늘은 경기도 용인 수지에 있는\n한 아파트 사시는 욕실 타일 시공 현장을\n소개하려고 해요.\n고객님이 급하게\n연락 주셔서 달려간 곳인데요,\n샤워부스 안쪽 벽면 타일이\n심하게 깨지고 터져 있었어요.\n욕실은 집에서 가장\n자주 사용하는 공간 중 하나잖아요?\n특히 샤워부스는\n뜨거운 물과 차가운 물이 오가고,\n항',
        images: [
          'https://postfiles.pstatic.net/MjAyNjA1MjVfOTUg/MDAxNzc5NjQxMjUxMDgy.1kafMkn5h2ScJpmNbir-4jpRpl59GSbdD1sm_E4GnJkg.s59MhYqaXLXAEQYyLgJD0FU2ZArqnh32KuArRE6z5Fgg.PNG/003.png?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA1MjVfMTY0/MDAxNzc5NjQxMjUxMDg5.ypYn0Rv7YoFx099eueR9Dr3B5e5pAUPgFqEkdiQaVWQg.hjMkhgsbWReLqJ7XvVFheJXEcnjcW7Lknu9d3acFrtog.PNG/004.png?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA1MjFfMTk0/MDAxNzc5MzU0OTk5NjU4.ZS8DFqi5L4-DBvycBUeUSPD9HGnPX8EO5udOGaXdV6Mg.dgGR1dPql6Hlha_zWPqGnOKCikW-0arzUfjC9SU9CVQg.JPEG/KakaoTalk_20260518_085134842.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA1MjFfMjMw/MDAxNzc5MzU0OTk5NjA0.OCjDPLG9niV8ps2jqZpi3w2kt9nY5lFwCR5c5IrJeecg.I7f5jFo7ar_UFV2NPnMBKTL3ELfw3VZEmkexKUsM8JYg.JPEG/KakaoTalk_20260518_085134842_01.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA1MjFfMTI2/MDAxNzc5MzU1MDAyMzIz.Li_Xf-6qOt3N1Phyv8DCEvtPlRfOz6UuPSWC_XgIZRkg.Wzks6L77nUZggXpQdsFau1vk7-HCynz6E4rNoz5xHc8g.JPEG/KakaoTalk_20260518_085134842_02.jpg?type=w966',
        ],
        sourceUrl: 'https://blog.naver.com/eui6212/223000000021',
        createdAt: EPOCH,
        modifiedAt: EPOCH,
      },
      {
        id: 22,
        memberId: 9003,
        title: '시흥시 은행동 타일 수리 욕실 벽 솟음 보수 방법',
        content:
          '시흥시 은행동 타일 수리 욕실 벽 솟음 보수 방법\n안녕하세요!\n수도권 타일 전문\n프로홈픽서\n인사드려요~\n저희는 경기도와 수도권 전 지역에서\n위험한 타일을\n안전하게 바꿔드리고 있습니다.\n올해 여름은\n유독 장마가 늦게 찾아왔네요.\n비 내리면서 벽 뒤에 습기가 차다 보니\n늦게 타일 문제를 발견하시고\n수리 요청을 주시는 분들이 늘었습니다.\n타일이 튀어나와 놀라셨겠지만\n전혀 걱정하실 필요 없답니다!\n베테랑 전문업체 프로홈픽서가\n처음부터 끝까지 싹 해결해 드리니까요.\n경기도와 수도권 지역에서\n타일 안전을 책임지고 있습니다.\n오늘 저희가 소개할',
        images: [
          'https://postfiles.pstatic.net/MjAyNjA3MDZfMjU0/MDAxNzgzMjYzNzE5NDc4.yyvDlS6gjUMWiwyBAA1yWn5HLygzTnPf6wUm4sJDNPEg.cV5g7UDAcwnPEwi4htNKdkf7ZpeNCh3Qihob9CNvDosg.PNG/005.png?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDZfMTE0/MDAxNzgzMjYzNzE5NDc2.vqn1H1bUfZrbWsXwSBvDFUtjgZveLJ9g7zRcsxQKeaog.UqMbx3vwZSPdlev7VC1PMVwVZmp2CkuntGYPTUxs1tog.PNG/006.png?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDFfMTYx/MDAxNzgyOTAxNDQxODcx.XFwxmVeZHwarsy5rGIdNtuFBNW3x-Mv9taD1n7hWidkg.Ia-U1Nja71bW-ILLOA7dfN-j0Z1hvG9bHeLpfYUnUasg.JPEG/KakaoTalk_20260701_100458208.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDFfMjE0/MDAxNzgyOTAxNDQyMDE0.SkcD8jME3t3RcsL522DOIXRKsChYYWuhqOsttTLGTrUg.FqmsekI_IZZEVj6bMIGwrfX5UgWB7Buub5hHbkVDUqEg.JPEG/KakaoTalk_20260701_100458208_01.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDFfMTcx/MDAxNzgyOTAxNDQyMjcw.zm6c4DGUWf26Ce-whx9AiH2gSCa9wVTm5Hl20-E7HbIg.0YUcGqNVEKxn-xb9pTgnQjauMCTYiDMYwxhFBzkXNkMg.JPEG/KakaoTalk_20260701_100458208_02.jpg?type=w966',
        ],
        sourceUrl: 'https://blog.naver.com/eui6212/223000000022',
        createdAt: EPOCH,
        modifiedAt: EPOCH,
      },
      {
        id: 23,
        memberId: 9003,
        title: '군포 산본 타일교체,  신속한 현장 후기',
        content:
          '군포 산본 타일교체, 신속한 현장 후기\n안녕하세요!\n수도권 타일 전문\n프로홈픽서\n인사드려요~\n저희는\n내 집처럼 시원하게 고쳐드리는\n전문 집수리업체로\n매일 마주하는\n집안 공간에 문제가 생기면\n곧바로 빠르게 해결해 드립니다.\n최근 군포 산본 지역에서\n"누수 공사 후에 바닥이\n망가졌는데 도와주세요"\n라며\n다급한 전화를 받았습니다.\n어떤 사연과 과정이 있었는지\n현장의 생생한 사진들과 함께\n지금부터 자세히 들려드릴게요.\n[글 요약]\n이번 현장은\n군포 산본에서 진행한\n긴급 타일 교체 이야기입니다.\n누수 수리 후\n덩그러니 방치되었더라고요.\n미장',
        images: [
          'https://postfiles.pstatic.net/MjAyNjA3MDZfMjgy/MDAxNzgzMjYzNzAzMDQw.4v3xOrSn7ssdHTOaqFtHAwZdW6BDCDwXL9XMnJlp3fkg.bzEFQdq-Mq2VOAWPZEiYF9iEAKZaBQFSuonwYkXqVVgg.PNG/003.png?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDZfMjQg/MDAxNzgzMjYzNzAzMDI5.ih2EO8HLJT_86BN_8vvFOAOhSgyR9xlWoW-VsX4totAg.NU7NzBWZ38n2E2-fM1GNfaMdGq4bBrBR1e6hwHVIHhAg.PNG/004.png?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDFfMjg0/MDAxNzgyOTAxMDczNjYw.TXnVuxxcj2Qmp9SlpuTmfMbYV8W0FjnM3shxqoddjlAg.ICMEE-NXggGW2PLj-BosioPJMjD-gZPxUvc_ghDDw3kg.JPEG/KakaoTalk_20260701_100438289_01.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDFfNTgg/MDAxNzgyOTAxMDczODcw.5jQsdJzilmKnlQAXu8yZMJZA8XLHWn7IYmbGoDHcrpIg.Swyia9J6NDFMBBknPd9UEqCm_b3lDn0L62WtyZcykjUg.JPEG/KakaoTalk_20260701_100438289_02.jpg?type=w966',
          'https://postfiles.pstatic.net/MjAyNjA3MDFfMzAw/MDAxNzgyOTAxMDczOTM0.vCkp4peLGVNrbQEvv7ONuv47ESSN1sjCv2Rw39c3B4Ig.VHw0ETab0WHA4hUxV0DhncaDyupzk2FMbTde2S6VgzMg.JPEG/KakaoTalk_20260701_100438289_03.jpg?type=w966',
        ],
        sourceUrl: 'https://blog.naver.com/eui6212/223000000023',
        createdAt: EPOCH,
        modifiedAt: EPOCH,
      },
    ],
  },
]

// 크롤링 시드 글은 연결된 시공사례(task) 없음 — 스펙 nullable 그대로 null.
const SEEDS: CrawledMember[] = RAW.map((member) => ({
  ...member,
  posts: member.posts.map((post) => ({ ...post, taskId: null, task: null })),
}))

const toSummary = ({
  posts,
  credentials: _credentials,
  ...rest
}: CrawledMember): CrawledMemberSummary => ({
  ...rest,
  thumbnails: posts.flatMap((post) => post.images.slice(0, 1)),
})

export const crawledOverrides = [
  getGetCrawledMembersMockHandler(
    (): CursorPageCrawledMemberSummary => ({
      content: SEEDS.map(toSummary),
      hasNext: false,
      nextCursor: undefined,
    })
  ),
  // 상세는 직접 작성 — 미존재 id 를 404 로 반환해 에러 UI(isError) 경로가 로컬에서도 재현되게
  // (generated mock 은 항상 200 이라 not-found 경로를 검증할 수 없음)
  http.get('*/api/v1/crawled-members/:id', ({ params }) => {
    const found = SEEDS.find((seed) => seed.id === Number(params.id))
    if (!found) return HttpResponse.json({ success: false, data: null }, { status: 404 })
    return HttpResponse.json({ success: true, data: found })
  }),
]
