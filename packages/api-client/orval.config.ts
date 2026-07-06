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
          // 파라미터 없는 쿼리는 no-arg 무효화.
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
            // 자격/인증 변경 → 자격 목록 (getCredentials: memberId 파라미터 → broad, getMyCredentials: 무파라미터)
            // TODO(#728): getCredentials 는 정밀키(memberId) 필요 — ADR-0025 line 61.
            //   memberId 는 mutation payload 밖(부모 스코프)이라 config 는 broad 만 가능. 수동 유지 vs broad 추후 결정.
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
            // TODO(#728): 프로필(updateMyProfile/updateMyProfileAbout)은 flip 후 '내 프로필' 조회 훅이
            // 재정렬 대기(옛 getMyProfile 제거, getProfile 은 /profiles/{id} 타 프로필) — 훅 정렬 시 타겟 확정 후 추가.
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
