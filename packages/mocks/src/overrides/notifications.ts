import { http, HttpResponse } from 'msw'

// 알림 도메인은 BE 미구현 → orval generated 핸들러 없음. 독립 placeholder 핸들러.
// 응답 shape 은 @bconnect/features 의 AppNotification 과 맞춘다 (BE 확정 시 generated 로 교체).
const PLACEHOLDER = [
  {
    id: 1,
    type: 'CHAT',
    title: '새 메시지',
    body: '김기술님이 메시지를 보냈습니다.',
    read: false,
    createdAt: '2026-06-03T09:00:00.000Z',
  },
  {
    id: 2,
    type: 'RECOMMENDATION',
    title: '새 추천서',
    body: '이업체님이 회원님에게 추천서를 작성했습니다.',
    read: false,
    createdAt: '2026-06-02T15:20:00.000Z',
  },
  {
    id: 3,
    type: 'SYSTEM',
    title: '프로필이 노출되었어요',
    body: '오늘 12명의 업체가 회원님의 프로필을 확인했습니다.',
    read: true,
    createdAt: '2026-06-01T08:30:00.000Z',
  },
]

export const notificationsOverrides = [
  http.get('*/api/v1/notifications', () => HttpResponse.json({ success: true, data: PLACEHOLDER })),
]
