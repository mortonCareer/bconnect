import { defineConfig } from 'orval'

// codegen 설정. 파이프라인·transformer 규칙: packages/api-client/CLAUDE.md
export default defineConfig({
  morton: {
    input: {
      target: './src/openapi.yaml',
      override: {
        transformer: './orval.transformer.ts',
      },
    },
    output: {
      mode: 'single',
      target: './src/generated/api.ts',
      schemas: './src/generated/schemas',
      client: 'react-query',
      mock: { type: 'msw', useExamples: true, baseUrl: '*', locale: 'ko' },
      override: {
        mutator: {
          path: './src/client.ts',
          name: 'customFetch',
        },
        query: {
          useQuery: true,
          useMutation: true,
          useSuspenseQuery: true,
          // mutation 성공 시 관련 쿼리 자동 무효화 — 각 FE 호출부의 수동 invalidateQueries 대체 (#728, ADR-0025).
          // operationId 는 becompat transformer(orval.transformer.ts) 산출 이름 기준 — 규칙 변경 시 동반 갱신.
          // 조건(파라미터) 없는 조회는 그 목록만 정확히 다시 불러오도록 무효화된다.
          mutationInvalidates: [
            // 게시물(작업물) 변경 → 피드 목록 (getFeeds: 파라미터 없음)
            { onMutations: ['createPost', 'updatePost', 'deletePost'], invalidates: ['getFeeds'] },
            // 작업(Task) 변경 → 작업 목록 (worker/company/assignee 전 변형 + 삭제)
            {
              onMutations: [
                'createTaskWorker',
                'createTaskCompany',
                'updateTaskWorker',
                'updateTaskCompany',
                'updateTaskAssignee',
                'deleteTask',
              ],
              invalidates: ['getTasks'],
            },
            // 추천서: 받은 목록(hide/show), 보낸 목록(create/update/delete)
            {
              onMutations: ['hideRecommendation', 'showRecommendation'],
              invalidates: ['getMyReceivedRecommendations'],
            },
            {
              onMutations: ['createRecommendation', 'updateRecommendation', 'deleteRecommendation'],
              invalidates: ['getMySentRecommendations'],
            },
            // 자격/인증 변경 → 자격 목록. getMyCredentials(내 목록, 조건 없음)는 그 목록만 정확히 무효화.
            // getCredentials 는 memberId 로 회원별 구분 → config 가 그 값을 몰라 관련 목록을 한꺼번에 무효화(넓게).
            // TODO(#728): getCredentials 를 특정 회원만 무효화하려면 화면 쪽 수동 배선 필요(ADR-0025 line 61). 넓게 둘지 좁힐지 추후 결정.
            {
              onMutations: [
                'createCredential',
                'acceptCredential',
                'denyCredential',
                'deleteCredential',
              ],
              invalidates: ['getCredentials', 'getMyCredentials'],
            },
            // 내 회원정보 변경 → 내 회원정보
            { onMutations: ['updateMyMember'], invalidates: ['getMyMember'] },
            // 알림 읽음 처리(단건/전체) → 알림 목록 + 안읽음 개수
            {
              onMutations: ['updateNotificationRead', 'updateNotificationsRead'],
              invalidates: ['getNotifications', 'getNotificationsUnreadCount'],
            },
            // TODO(#728): 프로필 수정(updateMyProfile/updateMyProfileAbout) → '내 프로필' 조회 무효화는 보류.
            // 지금은 '내 프로필' 전용 조회 훅이 없다(getProfile 은 /profiles/{id} 남의 프로필). BE 정합으로 훅 생기면 추가.
          ],
        },
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mock: {
          format: {
            'image-url': () => 'https://placehold.co/600x400',
          },
        },
      },
    },
  },
})
