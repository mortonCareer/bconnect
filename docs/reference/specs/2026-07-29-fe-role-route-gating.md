# FE 역할(Role) 기반 라우트 게이팅

> **For**: career/plan FE 를 작업하는 개발자.
> **You'll be able to**: 프로필 미생성·업체 미등록 회원의 진입을 막는 구조와, 새 페이지를 추가할 때 무엇을 해야 하는지 파악한다.

- **작성일**: 2026-07-29
- **관련**: [#1099](https://github.com/mortonCareer/bconnect/issues/1099), [#1066](https://github.com/mortonCareer/bconnect/issues/1066), [ADR-0027](../../explanation/adr/0027-role-route-gating-client-component.md), [ADR-0028](../../explanation/adr/0028-rendering-strategy-csr-for-authenticated.md)

---

## 배경

BE 가 회원 역할(`Role`)에 `CAREER`, `PLAN` 을 추가하고 `Member.role` 을 `Member.roles` 로 바꿨습니다 ([PR#1083](https://github.com/mortonCareer/bconnect/pull/1083)). 역할은 온보딩 완료 표식입니다 — 기술자 프로필을 만들면 `CAREER`, 업체를 등록하면 `PLAN` 이 부여됩니다.

BE 는 이 역할로 엔드포인트를 막습니다. [SecurityConfig](../../../apps/api/src/main/java/to/bconnect/api/security/SecurityConfig.java) 기준으로 작업 등록·섭외 수락은 `CAREER`, 프로젝트 CRUD·섭외 발신은 `PLAN` 이 필요합니다.

FE 는 아직 역할을 보지 않습니다. 그래서 프로필 없이 career 에, 업체 없이 plan 에 그대로 들어가집니다. 화면은 열리는데 주요 동작만 403 이라, 사용자 입장에서는 무엇이 잘못됐는지 알 수 없습니다.

같은 조사에서 나온 토큰 갱신 문제는 [#1100](https://github.com/mortonCareer/bconnect/issues/1100) 으로 분리했습니다. 서로 의존하지 않습니다 — 이 문서의 게이트는 `/members/me` 응답을 보고 판정하므로 토큰에 담긴 역할과 무관하고, 반대로 #1100 도 게이트 없이 단독으로 유효합니다.

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

| 파일                                            | 역할                          |
| ----------------------------------------------- | ----------------------------- |
| `packages/features/src/_shared/RequireRole.tsx` | 게이트 본체. career/plan 공용 |

요구 역할과 이동 경로가 모두 문자열이라 Server Component 인 레이아웃이 직접 렌더할 수 있습니다. 앱별 래퍼가 필요 없습니다.

### 고치는 것

| 파일                                                                                      | 변경                                                                              |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [apps/career/src/app/(main)/layout.tsx](<../../../apps/career/src/app/(main)/layout.tsx>) | 본문을 게이트로 감쌉니다. 하단 네비는 바깥에 그대로 둡니다                        |
| [apps/plan/src/app/(main)/layout.tsx](<../../../apps/plan/src/app/(main)/layout.tsx>)     | 본문과 패널을 함께 감쌉니다. 사이드바는 바깥에 그대로 둡니다                      |
| [packages/mocks/src/overrides/chats.ts](../../../packages/mocks/src/overrides/chats.ts)   | mock 회원에 `PLAN` 추가. 없으면 mock 환경에서 plan 이 전원 업체 생성으로 튕깁니다 |

`proxy.ts` 는 손대지 않습니다. 로그인 가드와 역할 가드는 보는 대상이 달라 경로 목록을 공유할 일이 없습니다.

### 선행 작업

로컬 생성물이 낡아 있습니다. `packages/api-client/src/generated/schemas/role.ts` 가 `GUEST|USER|ADMIN` 인데 스펙은 `SIGNUP|GUEST|CAREER|PLAN|ADMIN` 입니다. 작업 전에 `pnpm api:generate` 를 돌립니다.

---

## 동작 규칙

### 역할이 없다고 확실히 알 때만 이동

```
비로그인    → 그대로 렌더 (조회 자체를 하지 않음)
조회 중     → 그대로 렌더
조회 실패   → 그대로 렌더
역할 있음   → 그대로 렌더
역할 없음   → 생성 페이지로 이동
```

**비로그인**에서 조회를 걸어두는 이유는 게스트가 볼 수 있는 화면마다 401 을 만들지 않기 위해서입니다 ([#802](https://github.com/mortonCareer/bconnect/issues/802)). 판정에는 표시 쿠키(`hasAuthHint`)를 씁니다.

**조회 중**에 막지 않는 이유는 hydration 때문입니다. 표시 쿠키는 브라우저에만 있어 서버 렌더에서는 항상 "비로그인" 으로 읽힙니다. 조회 중에 화면을 비우면 서버가 그린 것과 브라우저가 그린 것이 달라져 React 가 트리를 통째로 다시 그리고, 콘솔에 hydration 오류가 남습니다. 통과시키면 양쪽이 같은 결과라 문제가 없습니다.

**조회 실패**에서 막지 않는 이유는, 네트워크가 끊긴 상황을 "권한 없음" 으로 잘못 판정하지 않기 위해서입니다. 401 은 [client.ts](../../../packages/api-client/src/client.ts) 가 토큰 갱신 후 재시도하고, 최종 실패하면 표시 쿠키가 지워져 다음 이동에서 proxy 가 로그인으로 보냅니다.

판정 전 화면이 잠깐 보일 수 있으나 데이터는 BE 가 막습니다. 그리고 이 구간은 브라우저 새로고침에서만 생깁니다 — 앱 안에서 페이지를 옮길 때는 캐시가 살아 있어 즉시 판정됩니다.

### 이동은 렌더 도중에

`useEffect` 가 아니라 렌더 도중 `redirect()` 를 부릅니다. `useEffect` 는 화면이 그려진 뒤에 실행되므로 한 번 더 깜빡입니다.

### 경로 예외는 없습니다

게이트는 `(main)` 레이아웃에만 있고, 그 안에서는 예외 경로가 없습니다. 프로필 생성 · 업체 생성 · 약관 같은 목적지는 애초에 `(main)` 밖이라 게이트를 거치지 않습니다.

plan 은 본문과 함께 패널(`PanelHost`)도 감쌉니다. `?panel=messages` 처럼 보호가 필요한 패널이 게이트 밖에 있으면, 이동이 끝나기 전까지 그려집니다.

### 더 좁은 역할이 필요하면 겹쳐서

같은 앱 안에서 더 좁은 역할이 필요하면 해당 구간의 `layout.tsx` 에 게이트를 하나 더 둡니다. 바깥 게이트와 자연스럽게 둘 다 만족해야 통과합니다. 같은 캐시를 보므로 요청이 늘지 않습니다.

### 화면 요소 하나를 숨길 때는 게이트를 쓰지 않습니다

`RequireRole` 은 이동이 본질이라, 버튼 하나를 감쌌는데 조건이 어긋나면 페이지 전체가 튕깁니다. 그런 경우에는 역할 보유 여부를 참/거짓으로 답하는 훅이 필요합니다. 지금은 쓰이는 곳이 없어 만들지 않습니다.

비회원이 동작을 시도했을 때 로그인을 권하는 것은 plan 의 [`useLoginGate()`](<../../../apps/plan/src/app/(main)/_components/LoginGateProvider.tsx>) 가 이미 담당합니다. 축이 다르므로 손대지 않습니다.

---

## 개발자가 기억할 것

> **`(main)` 아래에 만든 화면은 자동으로 보호됩니다. 따로 할 일이 없습니다.**

역할 없이 열려야 하는 화면이라면 `(main)` 밖에 두면 됩니다. 가입 · 약관 화면이 그렇게 되어 있습니다.

---

## 검증

FE 에 테스트 러너가 없으므로 실제 브라우저로 확인합니다.

1. 프로필 없는 회원(역할이 `GUEST` 뿐)이 로그인하면 career 홈에서 `/signup/profile` 로 이동합니다
2. 프로필 생성 직후 재로그인 없이 `/profile` 에 들어갑니다 (캐시 갱신 확인)
3. plan 에서 업체 미등록 상태로 보호 경로 · `?panel=messages` 에 들어가면 `/signup/corp` 로 이동합니다
4. 비로그인은 career 홈과 타인 프로필을 그대로 보고, `/members/me` 요청이 나가지 않습니다
5. 로그인 상태에서 보호 화면을 새로고침해도 콘솔에 hydration 오류가 없습니다
6. `pnpm build:career` · `pnpm build:plan` 이 통과합니다

---

## 범위 밖

- **업체 탈퇴 시 즉시 반영**: [CompanyService](../../../apps/api/src/main/java/to/bconnect/api/core/domain/company/CompanyService.java) 가 `PLAN` 을 회수하지만, 다음 토큰 갱신 때 자연히 반영되도록 둡니다. 그 사이 보호 화면이 열리더라도 데이터는 BE 가 막습니다
- **캐시 저장(persist)**: 새로고침 직후에도 판정을 끝내두려면 캐시를 디스크에 저장해야 하는데, 그러면 로그아웃 시 파기가 의무가 되고 개인정보가 브라우저에 남습니다. 오프라인 대응이 요구사항이 되면 다시 봅니다
- **권한 라이브러리 도입**: 지금은 역할 목록에 포함 여부만 보면 됩니다
- **FE 테스트 러너 도입**

---

## 발견 사항 (별도 이슈)

**[#1100](https://github.com/mortonCareer/bconnect/issues/1100) — 생성 후 토큰 갱신 누락**: 프로필 · 업체를 만들어도 이미 발급된 토큰에는 역할이 반영되지 않습니다. 새로고침하면 풀리지만 그 전까지는 방금 만든 것이 없는 것처럼 동작합니다. 이 문서의 게이트와 판정 재료가 달라(`/members/me` 응답 대 토큰 클레임) 서로 의존하지 않으므로 분리했습니다.

**[#1098](https://github.com/mortonCareer/bconnect/issues/1098) — 인증 상태 소스 이원화**: 로그인 여부를 판정하는 소스가 표시 쿠키와 `auth-store` 둘로 갈라져 있습니다. 쿠키는 토큰 갱신 실패 시 스스로 지워지지만 `auth-store` 의 값은 앱이 직접 꺼야 하는데, 갱신 실패를 처리하는 코드가 공용 패키지에 있어 앱 저장소를 건드릴 수 없습니다. plan 은 로그아웃 기능 자체가 없어 한 번 켜진 값이 꺼지지 않습니다. 인가가 아니라 인증 축이라 분리했습니다.
