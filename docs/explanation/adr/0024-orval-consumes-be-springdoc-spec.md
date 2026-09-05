# ADR-0024: orval 이 BE springdoc spec 직접 소비 (손-작성 spec 폐기)

- 상태: 제안됨. #690 머지 시 승인됨
- 날짜: 2026-07-02
- 담당자: @manamana32321 (@fine-pine 리뷰 대기)

## 개요

[ADR-0003](0003-openapi-3-1-with-domain-split.md)은 `src/spec/` 하위 손-작성 도메인 분할 spec 을 도입했다. 해당 spec 은 14 파일 + redocly bundle 로 구성됐다. 이후 [ADR-0015](0015-be-code-as-api-ssot.md)가 BE 코드를 API SSOT 로 확정했다. BE-first 로 전환하면서 spec 은 "BE 구현을 따라가는 산출물"로 재정의됐다.

하지만 spec 은 여전히 손으로 BE 를 따라 갱신해야 했다. 구조적 이중관리다. 결과는 다음과 같다.

1. drift: BE 코드 ↔ 손-spec 사이 nullability·shape·phantom 엔드포인트 불일치 누적. 측정 시 nullability 정합 ~76%
2. 이중 유지보수: BE 변경마다 사람이 `src/spec/` 갱신 + redocly lint/bundle
3. ADR-0015 의 미결 결정: "spec 을 BE 에서 자동 생성 vs 손-작성 유지"를 명시적으로 남겨둠

이제 springdoc 이 런타임 introspection 으로 전체 spec 을 emit 할 수 있다. `generateOpenApiDocs`, `ModelResolver.enumsAsRef=true` 로 named enum 을 emit 한다. 미결 결정을 해소할 시점이다.

## 선택지

### 옵션 1: 손-작성 분할 spec 유지 (ADR-0003 현상)

BE 변경 시 `src/spec/` 를 손으로 동기화.

장점

- FE 캐논 네이밍·구조를 사람이 완전 통제

단점

- drift 상존, 이중 유지보수, redocly 툴체인 유지. ADR-0015(BE-SSOT)의 "자동 흐름" 정신과 배치

### 옵션 2: orval 이 springdoc spec 직접 소비 + becompat transformer (채택)

BE springdoc 산출 `src/openapi.yaml` → orval + 얇은 compile-time transformer 로 FE 캐논 정렬.

장점

- 단일 소스(BE), 손-spec drift 0, 새 CRUD 자동 흐름, redocly 의존 제거

단점

- opId 네이밍이 BE path 구조에 결합. 불규칙명은 예외맵 or FE 적응이 필요하다. 필터-인증 엔드포인트는 보충 필요. springdoc 특성인 nullability·enum 이 FE 관심사로 이동

### 옵션 3: 전면 하드코딩 (endpoint → opId 테이블)

규칙 없이 76 엔드포인트 수동 매핑.

장점

- 최대 명시성

단점

- 자동 흐름 영구 상실. 새 BE 엔드포인트마다 수동 등재, 안 하면 springdoc Java 메서드명 그대로 노출. silent drift. ADR-0015 정신 정면 위배

## 결정사항

옵션 2 채택. 파이프라인은 `apps/api` springdoc → `packages/api-client/src/openapi.yaml` → orval + `orval.transformer.ts` 다. `openapi.yaml` 은 ci-api-spec 이 `apps/api/` 변경 시 재생성·커밋한다. transformer 이름은 becompat 이다.

becompat transformer 가 springdoc ↔ FE 캐논 간극을 규칙으로 흡수:

- operationId 규칙: method + path 파생. 규칙이 구조상 못 잡는 소수만 `OPID_SPECIAL` 에 명시한다. 현재 5개다. 전면 테이블이 아니므로 옵션 3 을 배격한다
- schema `*Response` strip: 엔티티만 적용, op-DTO 는 keep-list
- envelope unwrap: compile-time 처리, 런타임은 customFetch
- auth 보충: 필터 기반이라 springdoc 이 못 보는 `/auth/otp/verify`·`/auth/refresh` 를 `auth-supplement.ts` 로 병합

`src/spec/` 13 파일과 `.redocly.yaml`, redocly 툴체인을 삭제한다. 규칙 기반이 ADR-0015 의 자동 흐름을 보존한다. 예외 5개는 이중관리가 아니다.

검증 결과 76 spec operation = 76 생성 hook 1:1 이다. 유실·충돌 0.

## 기대 효과

- 좋은 결과:
  - API 소스 단일화. 손-spec 이중관리·drift 제거
  - 새 BE CRUD 엔드포인트 사람 개입 0 으로 FE hook 흐름
  - redocly 의존성 `@redocly/cli` 와 bundle 단계 제거. 툴체인 축소
- 나쁜 결과:
  - opId 가 BE path 구조에 결합. 불규칙 이름은 `OPID_SPECIAL` 등재 or FE 호출부 적응
  - springdoc 한계가 FE 로 이동. nullability 는 BE 가 `required` emit 해야 정확하며 별도 트랙이다. 필터-인증은 `auth-supplement.ts` 보충 필요
  - becompat transformer 라는 새 유지보수면 발생. 단 규칙 기반이고 예외는 ~5개
- 중립적 결과:
  - flip 직후 FE 계약 정합은 1회성 별도 작업 Step2 다. 대상은 엔티티 shape·phantom hook 이다. 배선 자체는 무관

## 메모

- [ADR-0003](0003-openapi-3-1-with-domain-split.md) 을 supersede. 손-작성 도메인 분할 구조 `src/spec/` 삭제
- [ADR-0015](0015-be-code-as-api-ssot.md) 의 미결 해소. 미결 항목은 자동 생성 vs 손-작성이다
- 후속: nullability 는 BE `required` emit, FE 계약 정합은 Step2
- 작성 가이드: `how-to/write-docs.md` 5장. 해당 문서는 deprecated

## 참조

- [ADR-0015](0015-be-code-as-api-ssot.md) : BE 코드 SSOT
- [ADR-0003](0003-openapi-3-1-with-domain-split.md) : supersede 대상
- [PR #690](https://github.com/mortonCareer/bconnect/pull/690)
