# FE 역할(Role) 기반 라우트 게이팅

> **For**: career/plan FE 를 작업하는 개발자.
> **You'll be able to**: 프로필 미생성·업체 미등록 회원의 진입을 막는 구조와, 새 페이지를 추가할 때 무엇을 해야 하는지 파악한다.

- **작성일**: 2026-07-29
- **관련**: [#1099](https://github.com/mortonCareer/bconnect/issues/1099), [#1066](https://github.com/mortonCareer/bconnect/issues/1066), [ADR-0027](../../explanation/adr/0027-role-route-gating-client-component.md), [ADR-0028](../../explanation/adr/0028-rendering-strategy-csr-for-authenticated.md)

---

## 배경

BE 가 회원 역할(`Role`)에 `CAREER`, `PLAN` 을 추가하고 `Member.role` 을 `Member.roles` 로 바꿨습니다 ([PR#1083](https://github.com/mortonCareer/bconnect/pull/1083)). 역할은 온보딩 완료 표식입니다 — 기술자 프로필을 만들면 `CAREER`, 업체를 등록하면 `PLAN` 이 부여됩니다.

BE 는 이 역할로 엔드포인트를 막습니다. [SecurityConfig](../../../apps/api/src/main/java/to/bconnect/api/security/SecurityConfig.java) 기준으로 작업 등록·섭외 수락은 `CAREER`, 프로젝트 CRUD·섭외 발신은 `PLAN` 이 필요합니다.

FE 는 아직 역할을 보지 않습니다. 그래서 두 가지 문제가 있습니다.

1. 프로필 없이 career 에, 업체 없이 plan 에 그대로 들어가집니다. 화면은 열리는데 주요 동작이 전부 403 입니다.
2. 가입을 마친 직후에도 같은 상태가 됩니다. 역할은 DB 에만 부여되고 이미 발급된 토큰은 바뀌지 않기 때문입니다. 이 상태는 브라우저를 새로고침하면 풀리지만, 새로고침 전까지는 방금 만든 프로필 · 업체가 없는 것처럼 동작합니다.

---

## 결정

역할 판정은 **클라이언트 게이트 컴포넌트**가 합니다. 판정 소스는 `useGetMyMember().roles` 입니다. 근거와 대안 비교는 [ADR-0027](../../explanation/adr/0027-role-route-gating-client-component.md) 에 있습니다.

기존 `proxy.ts` 의 로그인 가드는 그대로 둡니다. 두 가드는 중복이 아니라 **서로 다른 질문**을 담당합니다.

|         | proxy 가드 | RequireRole         |
| ------- | ---------- | ------------------- |
| 질문    | 로그인했나 | 이 앱의 역할이 있나 |
| 재료    | 쿠키       | `/members/me` 응답  |
| 비용    | 왕복 없음  | 왕복 1회            |
| 모를 때 | 막습니다   | 통과시킵니다        |

---

## 구현 범위

### 새로 만드는 것

| 파일                                                    | 역할                                          |
| ------------------------------------------------------- | --------------------------------------------- |
| `packages/features/src/_shared/RequireRole.tsx`         | 게이트 본체. career/plan 공용                 |
| `apps/career/src/lib/routes.ts`                         | 공개 경로 목록. proxy 와 게이트가 함께 씁니다 |
| `apps/career/src/components/CareerRoleGate.tsx`         | 앱 전용 래퍼 (역할·이동 경로 주입)            |
| `apps/plan/src/lib/routes.ts`                           | 위와 동일. 패널 조건 포함                     |
| `apps/plan/src/app/(main)/_components/PlanRoleGate.tsx` | 앱 전용 래퍼                                  |

### 고치는 것

| 파일                                                                                                | 변경                                                                       |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [apps/career/src/proxy.ts](../../../apps/career/src/proxy.ts)                                       | 경로 상수를 `lib/routes.ts` 로 옮기고 `isPublicPath()` 를 씁니다           |
| [apps/plan/src/proxy.ts](../../../apps/plan/src/proxy.ts)                                           | 위와 동일                                                                  |
| [apps/career/src/app/(main)/layout.tsx](<../../../apps/career/src/app/(main)/layout.tsx>)           | `{children}` 만 게이트로 감쌉니다. 하단 네비는 바깥에 그대로 둡니다        |
| [apps/plan/src/app/(main)/layout.tsx](<../../../apps/plan/src/app/(main)/layout.tsx>)               | 위와 동일. 사이드바는 바깥에 그대로 둡니다                                 |
| [apps/career/src/app/signup/profile/page.tsx](../../../apps/career/src/app/signup/profile/page.tsx) | 프로필 생성 성공 후 `refreshAccessToken()` 을 부릅니다                     |
| [apps/plan/src/app/signup/corp/page.tsx](../../../apps/plan/src/app/signup/corp/page.tsx)           | 업체 생성 성공 후 동일                                                     |
| [packages/api-client/orval.config.ts](../../../packages/api-client/orval.config.ts)                 | `createProfile`·`createCompany` 성공 시 `getMyMember` 캐시를 비우도록 선언 |

### 선행 작업

로컬 생성물이 낡아 있습니다. `packages/api-client/src/generated/schemas/role.ts` 가 `GUEST|USER|ADMIN` 인데 스펙은 `SIGNUP|GUEST|CAREER|PLAN|ADMIN` 입니다. 작업 전에 `pnpm api:generate` 를 돌립니다.

---

## 동작 규칙

### 판정 3단계

```
면제 경로 · mock 환경   → 그대로 렌더
조회 중                 → 스켈레톤 (본문 자리만)
조회 실패               → 그대로 렌더
역할 있음               → 그대로 렌더
그 외                   → 생성 페이지로 이동
```

조회 실패에서 막지 않는 이유는, 네트워크가 끊긴 상황을 "권한 없음" 으로 잘못 판정하지 않기 위해서입니다. 401 은 [client.ts](../../../packages/api-client/src/client.ts) 가 토큰 갱신 후 재시도하고, 최종 실패하면 표시 쿠키가 지워져 다음 이동에서 proxy 가 로그인으로 보냅니다.

조회 중 스켈레톤은 **브라우저 새로고침에서만** 보입니다. 앱 안에서 페이지를 옮길 때는 캐시가 살아 있어 즉시 렌더됩니다.

### 이동은 렌더 도중에

`useEffect` 가 아니라 렌더 도중 `redirect()` 를 부릅니다. `useEffect` 는 화면이 그려진 뒤에 실행되므로 보호 화면이 한 번 깜빡입니다.

### 경로 목록은 앱마다 한 벌

공개 경로 판정은 앱 사정이 달라 게이트가 알지 않습니다. career 는 경로만, plan 은 경로와 `?panel=` 값을 함께 봅니다. 각 앱이 `isPublicPath()` 로 계산해 결과만 넘깁니다.

plan 래퍼는 `useSearchParams()` 를 쓰므로 반드시 `<Suspense>` 안에 둡니다. 경계가 없으면 빌드 시 사전 렌더가 실패합니다 ([#480](https://github.com/mortonCareer/bconnect/issues/480)).

### 더 좁은 역할이 필요하면 겹쳐서

같은 앱 안에서 더 좁은 역할이 필요하면 해당 구간의 `layout.tsx` 에 게이트를 하나 더 둡니다. 바깥 게이트와 자연스럽게 둘 다 만족해야 통과합니다. 같은 캐시를 보므로 요청이 늘지 않습니다.

### 화면 요소 하나를 숨길 때는 게이트를 쓰지 않습니다

`RequireRole` 은 이동이 본질이라, 버튼 하나를 감쌌는데 조건이 어긋나면 페이지 전체가 튕깁니다. 그런 경우에는 역할 보유 여부를 참/거짓으로 답하는 훅이 필요합니다. 지금은 쓰이는 곳이 없어 만들지 않습니다.

비회원이 동작을 시도했을 때 로그인을 권하는 것은 plan 의 [`useLoginGate()`](<../../../apps/plan/src/app/(main)/_components/LoginGateProvider.tsx>) 가 이미 담당합니다. 축이 다르므로 손대지 않습니다.

---

## 개발자가 기억할 것

> **공개 페이지를 추가하면 `lib/routes.ts` 에 등록합니다.**

보호 페이지는 등록이 필요 없습니다. 기본이 보호이기 때문입니다. 등록을 잊으면 공개 페이지가 로그인 벽 뒤로 숨는데, 이는 바로 눈에 띕니다. 반대 방향(보호 페이지가 열림)은 조용해서 위험하지만, 기본이 보호라 그쪽으로는 실패하지 않습니다.

---

## 검증

FE 에 테스트 러너가 없으므로 실제 브라우저로 확인합니다.

1. 신규 가입 후 프로필 미생성 상태에서 `/profile` 로 직접 들어가면 `/signup/profile` 로 이동합니다
2. 프로필 생성 직후 **새로고침하지 않고** 작업 등록이 403 없이 됩니다 (토큰 갱신 확인). plan 은 업체 등록 직후 사이드바에 '회사 미등록' 대신 회사명이 뜹니다
3. 프로필 생성 직후 재로그인 없이 `/profile` 에 들어갑니다 (캐시 갱신 확인)
4. plan 에서 업체 미등록 상태로 보호 경로에 들어가면 `/signup/corp` 로 이동합니다
5. career 홈과 타인 프로필은 비로그인·프로필 미생성 모두 통과합니다
6. 로그인 상태에서 보호 페이지를 새로고침하면 본문만 잠깐 스켈레톤이고 하단 네비는 유지됩니다
7. `pnpm build:plan` 이 통과합니다 (`useSearchParams` 사전 렌더)

---

## 범위 밖

- **업체 탈퇴 시 즉시 반영**: [CompanyService](../../../apps/api/src/main/java/to/bconnect/api/core/domain/company/CompanyService.java) 가 `PLAN` 을 회수하지만, 다음 토큰 갱신 때 자연히 반영되도록 둡니다. 그 사이 보호 화면이 열리더라도 데이터는 BE 가 막습니다
- **캐시 저장(persist)**: 새로고침에도 스켈레톤 없이 즉시 렌더하려면 캐시를 디스크에 저장해야 하는데, 그러면 로그아웃 시 파기가 의무가 되고 개인정보가 브라우저에 남습니다. 오프라인 대응이 요구사항이 되면 다시 봅니다
- **권한 라이브러리 도입**: 지금은 역할 목록에 포함 여부만 보면 됩니다
- **FE 테스트 러너 도입**

---

## 발견 사항 (별도 이슈)

작업 중 인증 상태를 판정하는 소스가 둘로 갈라져 있는 것을 확인했습니다. 표시 쿠키는 토큰 갱신 실패 시 스스로 지워지지만 `auth-store` 의 값은 앱이 직접 꺼야 하는데, 갱신 실패를 처리하는 코드가 공용 패키지에 있어 앱 저장소를 건드릴 수 없습니다. plan 은 로그아웃 기능 자체가 없어 한 번 켜진 값이 꺼지지 않습니다.

축이 다른 문제라 이 작업에 포함하지 않고 [#1098](https://github.com/mortonCareer/bconnect/issues/1098) 로 분리했습니다.
