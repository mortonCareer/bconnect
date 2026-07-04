# ADR-0025: 캐시 무효화를 orval `mutationInvalidates` config로 SSOT화

- **Status**: Proposed
- **Date**: 2026-07-04
- **Deciders**: @twjin03 (제안), @manamana32321 (CTO), @fine-pine (CEO)
- **Related**: #728 (구현 이슈), [ADR-0024](./0024-orval-consumes-be-springdoc-spec.md) (operationId 네이밍 전제)

## Context

FE는 React Query(orval 생성 훅)로 서버 상태를 캐시한다. mutation(생성/수정/삭제) 성공 후 관련 query가 stale이 되므로 `queryClient.invalidateQueries({ queryKey })`로 재fetch를 유도해야 한다.

현재 이 무효화는 **각 소비 파일이 수동 배선**한다 (career 9개 파일). 문제:

- **분산·불일치**: "어떤 mutation → 어떤 query 무효화" 관계가 9곳에 흩어져 있고, inline `onSuccess`·제출 핸들러 `Promise.all`·로컬 helper 등 형태도 제각각.
- **누락 위험**: 예) `useRecommendationActions`는 hide→받은목록만, delete→보낸목록만 무효화 — 반대 리스트가 stale로 남을 수 있다. 새 mutation 연동마다 재판단이라 실수가 누적된다.

orval 8.9.1은 `override.query.mutationInvalidates`로 "mutation → 무효화 query" 매핑을 codegen 설정에 선언하면 생성 훅 `onSuccess`에 `invalidateQueries`를 자동 주입한다. 이 관계를 config SSOT로 옮길 수 있다.

## Options

### Option A: 현행 유지 (수동 무효화)

- **장점**: 무효화 로직이 호출부에 그대로 보인다(지역 가시성). 추가 학습 없음.
- **단점**: 분산·누락 문제 지속. 연동이 늘수록 배선 부채 누적.

### Option B: `mutationInvalidates` config SSOT

- **장점**: 무효화 관계를 `orval.config.ts` 한 곳에 선언 → 9곳 수동 배선 제거, 스타일 통일, 누락 버그 근본 감소. 소비 파일에서 `getGetXQueryKey` import 소멸.
- **단점**: 무효화 로직이 호출부에서 안 보이고 config를 봐야 한다(지역 가시성↓). 기본 무효화가 넓어(coarse) 리페치 증가 여지. optimistic/커스텀 키 케이스는 여전히 수동.

## Decision

**Option B 제안**

- 실질 문제는 네이밍이 아니라 무효화 correctness(누락)이며, B가 원인을 다룬다.
- 로컬 PoC(2026-07-04, 미커밋·revert)로 정상 동작 확인: 규칙 선언 → 재생성 시 mutation `onSuccess`에 `invalidateQueries` 자동 주입, **기존 호출부 비파괴**(훅에 `queryClient?`·`skipInvalidation?`를 additive 추가, 내부 `useQueryClient()` 폴백), 사용자 `onSuccess`(toast 등)는 무효화 **이후** 실행, api-client tsc green.
- 우려했던 "과도 무효화"는 실측상 대개 **기존 수동 누락을 되레 고치는** 방향(hide/delete → 받은·보낸 양쪽). 순수 낭비 여지는 broad predicate 정도이며 필요 시 rule `params`로 좁힐 수 있다.

받아들이는 트레이드오프: 무효화 로직의 config 중앙화(지역 가시성↓), 기본적으로 넓은 무효화.

## Consequences

- **좋은 결과**: 무효화 SSOT화로 누락 감소, 소비 코드 경량화, 배선 통일. 신규 mutation 연동이 config 규칙 한 줄로 축소.
- **나쁜 결과**: 무효화가 `orval.config.ts`에만 보인다. broad 무효화로 불필요 리페치 여지. behavior-changing이라 마이그레이션 PR에 회귀 QA 필요.
- **중립적 결과**: optimistic/커스텀 키(예: notifications `setQueryData`)는 대상 밖 → 하이브리드(선언 가능한 것만 config, 나머지 수동).

## Notes

- **적용 순서**: config 도입은 #690 flip 위에 얹히며, **수동 호출부 제거는 훅 정렬(API 바인딩)과 같은 PR**에서 수행 → 그 시점에 전환기 typecheck red 해소 + 자동 무효화 인계. 매핑·규칙 상세는 #728.
- **프로필 무효화 보류**: `updateMyProfile`/`updateMyProfileAbout`의 '내 프로필' 조회 훅이 flip 후 재정렬 대기(옛 `getMyProfile` 소멸, `getProfile`은 `/profiles/{id}` 타 프로필) — 타겟 확정 후 추가.
- **operationId 결합**: 규칙은 becompat transformer(`orval.transformer.ts`) 산출 이름을 참조 → 네이밍 규칙 변경 시 동반 갱신(문서화 대상).
- **근거 SoT**: `@orval/query/dist/index.mjs`의 무효화 생성 로직. 신기능이라 orval.dev 문서보다 소스가 정확.
