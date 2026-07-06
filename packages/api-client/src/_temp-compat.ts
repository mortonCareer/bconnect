// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ 임시 호환 레이어 파일 — 개발 미리보기 서버를 띄우기 위한 임시 파일 (dev 머지 전에 반드시 삭제)
//
//   상황)
//   API 가 개편되면서 기능들의 이름이 바뀌거나 둘로 나뉘었다.
//   (예: '채팅' → '1:1 채팅' + '그룹 채팅', '작업 만들기' → '기술자용' + '업체용',
//    '내 프로필' 소멸 → '내 회원정보' + '프로필')
//
//   그런데 아직 여러 화면에서 여전히 예전 이름을 부르고 있는 상태다.
//   이런 곳이 한 군데라도 있으면 개발 미리보기 서버가
//   아예 켜지지 않는다.
//
//   임시 해결)
//   그래서 화면을 미리 보기 위해, 옛 이름을 현재 존재하는 새 기능에 임시로 이어 붙였다.
//   ⚠️ 급하게 이어 붙인 임시 연결이라 데이터 모양이 정확히 맞지 않는다. 여기서
//      고치지 않은 화면은 실제로 열어보면 잘못 동작할 수 있다.
//
//   api 연결 작업 가이드)
//   1. 연결할 페이지를 하나 정하고, 새 api 스펙에 맞게 연결한다.
//   2. dev 서버 미리보기로 동작을 확인한다.
//   3. 대체한 옛 이름의 잔여 사용처를 검색한다. (예: grep -rn "useGetMyChats" apps packages)
//   4. 남은 사용처가 없으면 이 파일에서 그 줄을 지운다.
//      단, 여러 페이지가 같은 옛 이름을 쓰면 전부 고쳐진 뒤에만 지울 수 있다 — 하나라도
//      남은 채 지우면 `Export ... doesn't exist in target module` 에러로 dev 서버가 안 뜬다.
//   5. 타입체크로 `has no exported member` 에러가 없는지 확인한다.
//
//   모든 api 연결 종료 후 정리)
//   모든 줄이 사라지면 이 파일과 index.ts 의 `export * from './_temp-compat'` 줄을 삭제한다.
//   ★ dev 브랜치에 합치기 전 이 파일은 반드시 사라져 있어야 한다.
// ═══════════════════════════════════════════════════════════════════════════
import type { Profile, Member, Message } from './generated/schemas'

// ── 프로필 / 회원 (프로필 화면을 새 이름으로 고치면 제거) ──────────────────
export {
  useGetMyMember as useGetMyProfile, // TODO: '내 프로필'과 '내 회원정보'는 원래 다른 데이터 → 화면에서 분리 정합
  getGetProfileQueryKey as getGetMyProfileQueryKey,
  useCreateMember as useRegisterMember,
  useDeleteMyMember as useWithdraw,
  getGetProfileMockHandler as getGetMyProfileMockHandler,
  getGetProfileResponseMock as getGetMyProfileResponseMock,
} from './generated/api'
export type { MemberSummary as MaskedMember } from './generated/schemas'
// '프로필+회원 묶음'이 사라져서 비슷한 모양으로 임시 정의 — TODO: 프로필 화면에서 실제 모양 확정
export type ProfileAndMember = { profile?: Profile; member?: Member }

// ── 채팅 (메시지 화면을 새 이름으로 고치면 제거) ────────────────────────────
export {
  useGetDirectChats as useGetMyChats, // TODO: 원래는 1:1 + 그룹 채팅을 합쳐야 함 (지금은 1:1만)
  useGetDirectChats as useGetChat, // TODO: '채팅 하나 조회' 대체 필요 (지금은 1:1 목록)
  getGroupChatMessages as getChatMessages,
  getGetGroupChatMessagesQueryKey as getGetChatMessagesQueryKey,
  getGetGroupChatMessagesMockHandler as getGetChatMessagesMockHandler,
  getGetGroupChatsMockHandler as getGetChatMockHandler,
  getGetGroupChatsMockHandler as getGetMyChatsMockHandler,
} from './generated/api'
export type { DirectChat as Chat } from './generated/schemas'
// '메시지 더보기 묶음'이 사라져서 비슷한 모양으로 임시 정의
export type MessageCursorPage = {
  content?: Message[]
  nextCursor?: string | null
  hasNext?: boolean
}

// ── 작업 (캘린더/작업 화면을 새 이름으로 고치면 제거) ───────────────────────
export {
  useCreateTaskWorker as useCreateTask, // TODO: '기술자용' + '업체용' 분리 정합
  useUpdateTaskWorker as useUpdateTask, // TODO: 위와 동일
  useGetTasks as useGetMyTasks, // TODO: 날짜 범위로 조회하던 파라미터가 사라짐 → 캘린더 로직 손봐야 함
  getGetTasksQueryKey as getGetMyTasksQueryKey,
  getCreateTaskWorkerMockHandler as getCreateTaskMockHandler,
  getGetTasksMockHandler as getGetMyTasksMockHandler,
  getUpdateTaskWorkerMockHandler as getUpdateTaskMockHandler,
} from './generated/api'
export type {
  CreateWorkerTaskRequest as CreateTaskRequest,
  UpdateWorkerTaskRequest as UpdateTaskRequest,
} from './generated/schemas'

// ── 기기 (device — BE 미구현 팬텀, 정합 시 mock override 통째 삭제 대상) ─────
export { getCreateDriveMockHandler as getRegisterDeviceMockHandler } from './generated/api'
export type DevicePlatform = string
