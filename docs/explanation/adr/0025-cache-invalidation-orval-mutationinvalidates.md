# ADR-0025: 캐시 무효화를 orval `mutationInvalidates` config로 SSOT화

- 상태: 제안됨
- 날짜: 2026-07-04
- 담당자: @twjin03 (제안), @manamana32321 (CTO)

## 개요

FE는 orval 이 생성한 TanStack Query 훅으로 서버 상태를 캐시한다. 생성·수정·삭제 mutation 성공 후 관련 query가 stale이 되므로 `queryClient.invalidateQueries({ queryKey })`로 재fetch를 유도해야 한다.

현재 이 invalidates는 각 소비 파일이 수동 배선한다. career 9개 파일이 해당한다. 현행 방식의 한계:

- 분산·불일치: "어떤 mutation → 어떤 query 무효화" 관계가 9곳에 흩어져 있다. inline `onSuccess`·제출 핸들러 `Promise.all`·로컬 helper 등 형태도 제각각이다.
- 누락 위험: 수동 배선할 경우 mutation이후 필요한 무효화를 누락시킬 위험이 있다.

orval 8.9.1은 `mutationInvalidates` 기능을 제공한다.

- `override.query.mutationInvalidates`로 "mutation → 무효화 query" 매핑을 `orval.config.ts`에 선언하면,
- 생성 훅 `onSuccess`에 `invalidateQueries`를 자동 주입한다.

결국 mutation -> invalidates config SSOT로 옮길 수 있다.

## 선택지

### 옵션 A: 현행 유지 (수동 무효화)

장점:

- 무효화 로직이 호출부에 그대로 보인다. 지역 가시성이 확보된다.
- 추가 학습 없음, 현행 방식 유지 가능

단점:

- 분산·누락 문제 지속.
- 연동이 늘수록 배선 부채 누적 위험이 있음.

### 옵션 B: `mutationInvalidates` config SSOT

장점:

- 무효화 관계를 `orval.config.ts` 한 곳에 선언 → 수동 배선 제거, 누락 버그 근본 감소.
- 소비 파일에서 `getGetXQueryKey` import 생략 가능.

예상 단점:

- 무효화 로직이 호출부에서 안 보이고 config를 봐야 한다. 지역 가시성이 낮아진다.
- 기본 무효화 범위가 넓어 리페치 증가 여지 있음.
- optimistic 갱신·커스텀 키 케이스는 여전히 수동 배선 필요. optimistic 갱신은 서버 응답을 기다리지 않고 캐시를 미리 바꾸는 방식이다.

## 결정사항

옵션 B 제안

- 우려했던 과도 무효화로 인한 낭비는 실측상 대개 기존 수동 누락을 오히려 고치는 방향.
- 진짜 낭비는 무효화 대상을 넓은 조건으로 잡을 경우에 발생한다. 이는 rule `params` 를 사용해서 좁힐 수 있음. 즉 config 안에서 해결·감당 가능한 리스크다.

받아들이는 트레이드오프:

- config로만 커버 불가능한 케이스가 있음 -> 하이브리드 방식 불가피.
  예) `FeedList` 새로고침 버튼은 유저 트리거를 통한 무효화 -> 무효화가 config + 수동 배선 두 곳에 나뉨
- `params`는 mutation 변수/리터럴만 참조 가능하다. payload에 없는 값으로는 정밀 키를 못 만듦. 예를 들어 부모 쿼리에서 온 `memberId` 등이다. -> 관련 목록을 통째로 무효화(broad)하는 걸 피하려면 수동 배선 필요

## 기대 효과

- 좋은 결과: 무효화 SSOT화로 누락 감소, 소비 코드 경량화, 배선 통일. 신규 mutation 연동이 config 규칙 한 줄로 축소.
- 나쁜 결과: 무효화가 `orval.config.ts`에만 보인다. 관련 목록을 통째로 무효화(broad)해 불필요한 리페치가 생길 여지.
- 중립적 결과: optimistic/커스텀 키는 대상 밖 → 하이브리드 방식. 예로 notifications `setQueryData`가 있다. 선언 가능한 것만 config, 나머지는 수동.

## 메모

- 하이브리드 원칙: 선언이 기본, 수동은 태그된 예외. mutation 성공 → query 무효화가 목적이면 config `mutationInvalidates`가 기본값. config로 표현 못 하는 케이스만 수동으로 남기되, 아래 태그를 반드시 단다.

- 수동 무효화 면제 사유 태그: 수동 유지하는 무효화 호출부엔 `// config 대상 밖: <사유>` 주석을 강제한다.

  | 사유                  | 언제                                | 예시                                                     |
  | --------------------- | ----------------------------------- | -------------------------------------------------------- |
  | `유저 트리거`         | 버튼 클릭·새로고침 등 mutation 아님 | "다시 시도" 버튼 → `invalidateQueries`                   |
  | `optimistic`          | 무효화가 아니라 캐시 직접 갱신      | `onMutate`/`setQueryData` 로컬 갱신                      |
  | `조건부/크로스도메인` | config 규칙 구조로 표현 불가        | 응답 값에 따라 대상 분기, 한 mutation이 타 도메인 무효화 |

  ```ts
  // config 대상 밖: 유저 트리거 (mutation onSuccess 아님)
  onClick={() => queryClient.invalidateQueries({ queryKey: getGetFeedsQueryKey() })}
  ```

- 근거 SoT: `@orval/query/dist/index.mjs`의 무효화 생성 로직. 신기능이라 orval.dev 문서보다 소스가 정확.

## 참조

- #728 : 구현 이슈
- [ADR-0024](./0024-orval-consumes-be-springdoc-spec.md) : operationId 네이밍 전제
