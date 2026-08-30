# ADR-0013: 프론트엔드 폼 처리 표준

- 상태: 제안됨
- 날짜: 2026-05-22
- 담당자: @manamana32321

## 개요

BConnect 프론트엔드의 폼 처리가 페이지마다 갈라져 있다. `apps/plan` 로그인은 수동 `useState`, `signup` 페이지들은 `react-hook-form`. 입력 컴포넌트도 파편화돼 있다. `packages/ui`의 `Input`은 cva·focus ring·`text-base` 기반이다. `apps/plan`·`apps/career`에 바이트 단위로 복제된 `FormInput`은 focus ring 없이 `text-r-16`을 쓴다. 여기에 `OtpInput`이 더해진다.

이 divergence가 같은 클래스의 버그를 반복 생산했다:

- [PR #369](https://github.com/mortonCareer/bconnect/pull/369) : login 입력에 에러 표시용 prop 누락. 에러 시 테두리가 안 변함. 실제 출시된 버그.
- 서버 에러 staleness : 잘못된 OTP 입력 후 값을 고쳐도 에러가 안 풀림.
- 접근성 전무 : 수동 폼은 `aria-invalid`·`aria-describedby`·label 연결이 없다.

근본 원인은 표준 부재다. 폼을 어떻게 구성하고, 에러를 어떻게 다루며, 어떤 입력 컴포넌트를 쓰는지가 정해져 있지 않다. 표준을 정해 이 버그 클래스를 구조적으로 제거한다.

## 선택지

### 옵션 1: 현행 유지, 페이지별 수동 처리

장점

- 추가 작업 없음.

단점

- divergence·버그 클래스 지속. 접근성 계속 부재. 신규 폼마다 검증·에러·상태를 재발명.

### 옵션 2: react-hook-form + zodResolver 표준화

장점

- signup에 이미 부분 채택. 사실상 React 폼 표준. 2026-05 기준 npm 주간 다운로드 ~53.9M, 차순위의 약 28배. zod는 이미 의존성. uncontrolled 기반이라 입력 시 재렌더 최소.

단점

- 수동 폼 대비 학습 곡선이 작게나마 있음. login 등 미적용 페이지 마이그레이션 필요.

### 옵션 3: TanStack Form

장점

- 풀 TypeScript 추론.

단점

- repo의 기존 RHF를 걷어내야 해 순손실. npm 다운로드가 RHF의 ~3.5%, ThoughtWorks Radar 미등재. 3명 팀에 신규 학습 부담.

### 옵션 4: React 19 네이티브 `<form action>` / Conform

장점

- progressive enhancement.

단점

- BConnect는 Server Action을 쓰지 않고 orval + TanStack Query mutation으로 API를 호출한다. 네이티브 Action의 전제가 없다. orval codegen 파이프라인과 충돌.

## 결정사항

옵션 2를 채택한다. react-hook-form + zodResolver 를 폼 라이브러리 표준으로 삼는다. 표준성과 기존 채택 자산, zod 정합성이 결정적이었다. 전체 설계는 다음과 같다.

### 1. 폼 라이브러리

- 검증 또는 제출이 있는 폼은 `react-hook-form` + `@hookform/resolvers/zod` 사용. 수동 `useState` 폼 금지.
- 단순 검색·필터·URL-state 입력(nuqs)은 폼이 아니므로 제외한다. bare `Input`을 사용한다.
- 검증 스키마는 zod v4를 쓰고 `schema.ts`에 분리한다. `zod/v3` compat import 금지.
- 검증 타이밍은 `mode: 'onTouched'`. blur 후 첫 검증, 이후 onChange 처럼 갱신한다. `isValid` 게이팅 버튼을 유지하면서 첫 타이핑 중 naggy 한 에러 노출을 피한다. onSubmit 은 제출 전 isValid 가 갱신되지 않아 버튼이 안 열린다.

### 2. 컴포넌트 레이어: shadcn Form + `*Field` 래퍼

- shadcn `Form` suite 를 도입한다. `FormField`/`FormItem`/`FormControl`/`FormMessage`/`FormLabel`/`FormDescription` 이 대상이다. `id`·`htmlFor`·`aria-describedby`·`aria-invalid` 접근성 배선을 자동 처리하기 때문이다. 수동 a11y 배선은 그 자체로 누락-취약하다.
- raw shadcn primitive 직접 사용은 지양한다. 기본은 `@bconnect/ui`의 `TextField` 래퍼다. 래퍼가 `FormField`+`FormItem`+…+`Input`+`FormMessage` 조합과 client·server 에러 합성을 한 컴포넌트로 흡수한다. 단, 디자이너 시안이 `*Field` 추상화로 표현되지 않는 커스텀 필드 레이아웃을 요구하면 raw `FormField` primitive로 내려갈 수 있다. 추상화가 모든 디자인을 커버하지는 못한다.
- 입력 컴포넌트 패밀리는 `*Field` 접미사로 통일: `TextField`, `TextareaField`, 향후 `SelectField` 등.
- `Input`과 `TextField`의 역할을 분리한다. `Input`은 bare primitive로 비-폼 입력에 쓴다. `TextField`는 RHF 폼 필드에 쓴다.
- plan·career에 복제된 로컬 `FormInput` 2벌은 폐기한다.

### 3. 에러 처리

- 클라이언트 zod 검증 에러는 RHF `formState`가 보유한다. `FormMessage`가 자동 표시한다.
- 서버 에러는 derive 패턴을 쓴다. 서버 에러를 "제출 시점 입력값 스냅샷"에 묶어 저장하고, 렌더 시 현재 입력값과 비교해 파생한다. 입력이 바뀌면 그 에러는 정의상 무효이므로 자동 소거된다. `setError('root')`는 미사용한다. 필드 변경으로 안 풀리는 known issue 때문이다. onChange마다 `clearErrors`를 호출하는 명령형 방식은 금지한다. [PR #369](https://github.com/mortonCareer/bconnect/pull/369)와 동형의 "누락하면 버그" 클래스다.
- `@bconnect/ui`의 `useServerError` 훅이 derive를 캡슐화한다. `ApiError` 의존은 `mapError` 콜백으로 분리한다. `packages/ui`가 `@bconnect/api-client`에 의존하지 않는다.

### 컴포넌트 레이어를 이렇게 정한 이유

raw shadcn primitive를 그대로 쓰면 필드 하나마다 `FormField`·`FormItem`·`FormControl`·`FormMessage`를 중첩해 적어야 해서 호출부 코드가 길어진다. 세 방법을 검토했다. (a) raw primitive를 그대로 사용, (b) a11y를 직접 구현한 커스텀 Field 컴포넌트, (c) shadcn Form 위에 얇은 래퍼. (b)는 shadcn이 이미 검증해 둔 a11y 배선을 재구현하는 낭비다. (a)는 호출부 코드가 긴 문제가 그대로 남는다. 그래서 (c)를 택했다. DX 검증 spike에서 로그인 페이지로 실측하니 raw FormField 228줄이 `TextField` 래퍼로 182줄이 됐다. 원본 수동 폼 218줄보다도 짧았다.

## 기대 효과

### 좋은 결과

- 폼 divergence 종식. 단일 패턴으로 [PR #369](https://github.com/mortonCareer/bconnect/pull/369)·서버 에러 staleness 등 버그 클래스를 구조적으로 제거.
- 접근성 자동. `aria-invalid`·`aria-describedby`·label 연결. QA 접근성 기준 충족.
- 입력 컴포넌트 SSOT. `FormInput` 2벌 폐기, `@bconnect/ui` 단일화.
- 호출부가 원본 수동 폼보다 짧다. spike 실측 결과다. 공용 인프라인 `TextField`·`useServerError`는 1회 작성하고 전 폼에 amortize된다.

### 나쁜 결과 / 비용

DX 검증 spike에서 실측한 마찰이다.

- raw shadcn `FormField`는 필드마다 컴포넌트를 중첩해야 해 호출부 코드가 길다. `TextField` 래퍼를 기본으로 써 완화한다.
- 렌더에서 `form.watch()`를 호출하면 React Compiler가 해당 컴포넌트 최적화를 건너뛴다. bail-out 이다. 폼 값은 `useWatch` 훅으로 구독한다.
- shadcn `FormControl`은 RHF `fieldState`만 `aria-invalid`로 반영한다. 서버 에러는 `aria-invalid`를 수동 OR 해야 하고, `TextField`가 내부에서 흡수한다.
- 멀티스텝 폼의 per-step 유효성은 `formState.isValid`로 표현되지 않는다. `trigger(field)` + 개별 판정이 필요하다.
- `mode: 'onTouched'`는 blur 후부터 에러를 노출한다. onChange 의 첫 타이핑 naggy 는 해소하나, 제출 전에도 touched 필드 에러는 보인다.
- 마이그레이션 비용이 든다. login(plan·career), signup 서버 에러, 입력 컴포넌트 통합이 대상이다.

### 중립

- `TextField`는 RHF 바인딩 전용이다. 비-폼 입력은 bare `Input`을 쓴다. 두 컴포넌트의 역할이 분리된다.
- spike 도중 별개 버그를 발견했다. 원본 로그인 페이지의 에러 코드 `OTP_INVALID` 등이 실제 API 코드 `A003`과 불일치한다. 한 번도 안 타던 dead code다. 별도 수정이 필요하다.

## 메모

후속 작업 (이슈):

- [#400](https://github.com/mortonCareer/bconnect/issues/400) : shadcn Form suite 도입 + 입력 컴포넌트 통합. ADR 0013 구현이다. login·signup 마이그레이션, `A003` 에러 코드 정합 포함.
- [#401](https://github.com/mortonCareer/bconnect/issues/401) : 폼 스키마 zod v3 → v4 import 정리

근거: 폼 처리 best-practice 조사와 DX 검증 spike. 조사는 라이브러리 표준성을 비교했다. spike는 react-hook-form·shadcn Form·`useServerError`·`TextField`를 로그인 페이지에 실제 적용해 라인 수·접근성·마찰을 실측했다.

검토 시점: shadcn Form 도입 후 폼이 20개+ 로 늘면 `TextField` 추상화 수준을 재평가한다.

## 참조

- [#396](https://github.com/mortonCareer/bconnect/issues/396) : 작업 이슈
- [PR #369](https://github.com/mortonCareer/bconnect/pull/369) : 계기가 된 버그
