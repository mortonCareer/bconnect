---
name: integrate-api
description: Figma 노드를 기반으로 디자인 시스템과 컴포넌트를 퍼블리싱합니다.
---

# integrate-api

사용자와 `AskUserQuestion` 스킬을 통해 대상 컴포넌트 · API 명세를 확인하고 데이터 연결을 수행합니다.

## 사전 조건

사용자 승인에 따라 `pnpm api:generate` 명령어를 실행합니다.

## 1. 데이터 연결 결정

코드를 작성 이전에 인터페이스를 확정합니다.

- 상태 관리 위치 : URL state (nuqs) vs React state
- 데이터 fetch 위치 : Server-side vs Client
- 예외처리 : 에러 바운더리 · Suspense 위치
- 로딩 전략 : Skeleton vs Spinner vs Optimistic

### 2. 데이터 연결

- Orval 훅 연결 : 스펙 변경 있었으면 선행
- MSW 핸들러 등록 : success / error / empty / loading 4개 시나리오
- Form 구현 : react-hook-form + zod resolver
- 공통 응답 처리 : `customFetch`가 응답 형식 `{success, data, error}` unwrap

## 참고 문서

- [개발 프로세스](../../../docs/how-to/development.md)
- [API 클라이언트](../../../docs/reference/package-api-client.md)
- [MSW 핸들러 패키지](../../../docs/reference/package-mocks.md)
