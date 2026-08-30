# ADR-0011: 본인 식별자·profile 조회 경로

- 상태: 승인됨
- 날짜: 2026-05-02 ([PR #251](https://github.com/mortonCareer/bconnect/pull/251) close / [PR #266](https://github.com/mortonCareer/bconnect/pull/266) 머지 시점)
- 담당자: @manamana32321, @fine-pine

## 개요

[PR #206](https://github.com/mortonCareer/bconnect/pull/206) sprint 1.5 openapi update 가 "미사용/중복 API 제거" 의도로 `getMyProfile` 단일 hook을 제거했다. 그러나 본인 profile 조회 대체 경로를 함께 제공하지 않았다. 결과로 FE는 본인 `profileId`를 획득할 방법이 없어졌다. [#248](https://github.com/mortonCareer/bconnect/issues/248)

결정 시점의 상태:

```text
login 응답:           { accessToken, refreshToken }   ← member 정보 없음
GET /members/me:      Member { id, ... }              ← profileId 없음
GET /profiles/me:     ✗ 존재 안 함 (PUT/DELETE만)
GET /profiles/{id}:   ProfileAndMember 반환           ← profileId가 있어야 호출 가능 (순환)
```

`fix/246-typecheck-drift` 브랜치가 이 때문에 막혔다. 해당 브랜치는 `ProfileAndMember` 스키마 분리 작업이며 typecheck 에러가 ~15개다.

핵심 force:

- layer 경계: 인증 컨텍스트 `User`/`UserDetails` 가 도메인 식별자 `profileId` 를 보유해도 되는가
- 호출 횟수: FE가 본인 profileId를 얻는 데 드는 round-trip
- 토큰 안정성: JWT payload에 claim을 추가하면 형식 변경 → 배포 시 전체 토큰 invalidation

## 선택지

### 옵션 1: `GET /api/v1/profiles/me` 추가

`/profiles/me`에 이미 PUT/DELETE가 있으므로 GET 추가가 일관성 ↑.

장점

- layer 경계 침범 0. 명시적·검색 가능한 endpoint. profile 데이터가 토큰 만료 주기와 무관.

단점

- FE가 본인 profileId 필요 시 HTTP 호출 1회 추가.

### 옵션 2: `Member` 스키마에 `profileId` 추가

장점

- `members/me` 한 번으로 profileId까지.

단점

- 모든 `Member` 응답에 `profileId` noise. profile 무관 context에서도 따라다님.

### 옵션 3: login/signup 응답에 `profileId` 포함

장점

- 본인 식별 시점에 함께 전달.

단점

- signup 직후엔 profile 미생성 → null. 토큰 갱신 시 stale. 인증 응답이 도메인 데이터를 운반.

### 옵션 4: JWT access token claim에 `profileId` 추가 + `sub` 표준화

논의 중 등장한 옵션. `profileId`를 JWT custom claim으로 싣고, 동시에 `sub`을 `username` → `memberId`로 표준화.

장점

- 인증된 요청에서 profileId lookup 0회. PK 기반이라 BE의 username→user 조회도 감소.

단점

- 인증 컨텍스트가 도메인 식별자 보유. layer 경계 논쟁 대상이다. claim 추가가 JWT 형식 변경 → 배포 시 전체 토큰 invalidation. profile 생성/변경이 토큰 갱신 주기에 묶임.

표준 근거 검토는 [#248](https://github.com/mortonCareer/bconnect/issues/248)의 재공유 코멘트 참조. 검토 대상은 IDDD, OIDC Core 1.0, Spring Security 6, Curity, 한국 Spring 커뮤니티 Adapter 패턴. "layer 침범이 아닌 표준 패턴" 자료다.

## 결정사항

전용 엔드포인트인 옵션 1 계열 채택. JWT claim 확장인 옵션 4 기각.

본인 식별자·profile 조회는 REST 엔드포인트 `GET /members/me` + `GET /profiles/me` 로 제공한다. JWT access token의 payload는 확장하지 않는다. `sub`/`type`/`scope`는 [auth.yaml JwtPayload](https://github.com/mortonCareer/bconnect/blob/dev/packages/api-client/src/spec/v1/auth.yaml#L232-L272)의 현행 형식 유지.

결정 경위. 옵션이 세 번 오갔다:

1. [#248](https://github.com/mortonCareer/bconnect/issues/248) 초기: 옵션 4 채택 ("별도 endpoint 없음, BE ~10줄")
2. 오프라인 논의: fine-pine의 layer 침범 우려 → 옵션 1로 선회
3. CTO가 표준 자료로 옵션 4 재옹호 → fine-pine "JWT에 profileId 포함 기술적으로 가능, 의존성 사이클 없음" 동의
4. 카톡 최종 결론: 전용 엔드포인트

### 근거 : 조율 비용

fine-pine이 옵션 4의 기술적 가능성을 동의한 _뒤에도_ 옵션 1로 간 핵심 이유는 조율할 사항이 너무 많았다. "기술적으로 가능" ≠ "지금 끼워 넣기 좋다". 옵션 4가 함께 끌고 오던 결정·작업 축들:

- JWT payload 형식 변경 → 배포 시 전체 토큰 invalidation → 사용자 강제 로그아웃 timing을 어떤 신호와 누구와 맞출지 별도 합의
- `sub` 표준화 동시 진행 → `SessionService`/`sessions` 테이블 키 migration 범위 결정. 표준화는 username→memberId 다. [PR #251](https://github.com/mortonCareer/bconnect/pull/251)이 이미 범위 최소화로 sessions를 username에 남겼고, 그러면 마이그레이션이 반쪽이 된다
- [#246](https://github.com/mortonCareer/bconnect/issues/246) FE 토큰 decode utility 업데이트 → BE 배포와 같은 사이클에 맞춰 ship 필요
- layer 경계 논쟁 → IDDD 표준 vs 한국 Spring 커뮤니티 Adapter 패턴, 양쪽 모두 표준 근거가 있어 합의 자체에 시간 소요

반면 옵션 1은 단일 endpoint 추가 한 가지로 끝난다. BE가 `GET /profiles/me` 핸들러 하나 추가, 스펙 한 줄 추가, FE는 그 endpoint 호출. 토큰 형식 무관, sessions 무관, FE decode utility 무관, layer 논쟁 무관.

스프린트 진행 중 "옵션 4 + 그에 묶인 결정들 전부 합의" vs "옵션 1로 일단 unblock"의 무게가 결정적이었다. 옵션 4가 기술적으로 가능하더라도 _지금 끼워 넣기엔_ 조율 표면적이 너무 컸다.

### 부수 근거

- layer 경계 보존. 인증 컨텍스트 `User` 는 인증에 필요한 `memberId`, `role` 만 보유. 도메인 식별자 `profileId` 는 도메인 endpoint가 제공.
- JWT payload 안정성. claim을 추가하지 않으므로 이 결정만으로는 토큰 형식 변경·invalidation 없음.
- endpoint의 명시성. `/profiles/me`는 OpenAPI 스펙에 자기기술적이고 검색 가능. JWT claim은 토큰을 decode해야 보임.

## 기대 효과

### 좋은 결과

- 인증 layer와 도메인 layer 분리 유지. 한쪽 변경이 다른 쪽으로 새지 않음
- JWT payload가 인증 관심사로만 한정. profile CRUD가 토큰 lifecycle과 독립
- `GET /profiles/me`가 [PR #266](https://github.com/mortonCareer/bconnect/pull/266)의 도메인 분리 스펙에 자연스럽게 안착

### 나쁜 결과

- FE가 본인 profileId 필요 시 round-trip 1회 추가. 옵션 4였으면 0회다. `members/me`/`profiles/me` 호출로 해소
- BE가 매 해당 요청마다 profile lookup

### 중립적 결과

- `openapi.yaml`에 `GET /members/me`·`GET /profiles/me` 반영. [PR #266](https://github.com/mortonCareer/bconnect/pull/266)
- 옵션 4에 묶여 있던 `sub` 표준화는 이 결정으로 vehicle을 잃음. username→memberId 표준화다. 독립 가치가 있어 [#249](https://github.com/mortonCareer/bconnect/issues/249)가 "JWT claim 표준 정합성" 트래커로 재정의되어 승계
- 옵션 4 예시 구현인 [PR #251](https://github.com/mortonCareer/bconnect/pull/251)은 closed unmerged. "이해를 돕기 위한 예시 PR, 실제 구현은 BE 담당"

## 메모

- [#249](https://github.com/mortonCareer/bconnect/issues/249) 재정의. 원래는 "JWT sub 마이그레이션 + profileId claim 추가" 로 옵션 4 구현 트래커였다. 본 ADR이 옵션 4를 기각하면서 `profileId` claim 부분은 종료, `sub`/`type`/`scope` 표준 정합성 트래커로 재정의.
- [#246](https://github.com/mortonCareer/bconnect/issues/246) 재검토 필요. FE 후속이다. 토큰에서 profileId를 decode 하는 옵션 4 전제로 만들어졌으면 endpoint 호출로 재작성.
- 스펙 cross-reference 교정. [auth.yaml](https://github.com/mortonCareer/bconnect/blob/dev/packages/api-client/src/spec/v1/auth.yaml)이 JWT 표준 마이그레이션을 L228, L264, L271 세 곳에서 `#272`로 보내나 #272의 실제 범위는 RT cookie transport. 본 PR에서 재정의된 #249로 교정.

## 참조

- [#248](https://github.com/mortonCareer/bconnect/issues/248) : 출발 버그
- [#249](https://github.com/mortonCareer/bconnect/issues/249) : 옵션 4의 `sub` 표준화 부분을 승계·재정의
- [PR #251](https://github.com/mortonCareer/bconnect/pull/251) : 옵션 4 예시 구현, closed unmerged
- [#246](https://github.com/mortonCareer/bconnect/issues/246) : FE 후속
- [PR #206](https://github.com/mortonCareer/bconnect/pull/206) : `getMyProfile` 제거, 문제의 발단
- [PR #266](https://github.com/mortonCareer/bconnect/pull/266) : 엔드포인트가 반영된 spec overhaul
