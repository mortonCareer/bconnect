---
name: publish-figma
description: Figma 노드를 기반으로 디자인 시스템과 컴포넌트를 퍼블리싱합니다.
---

# publish-figma

사용자와 `AskUserQuestion` 스킬을 통해 Figma 노드 기반으로 요구사항을 논의하고 컴포넌트를 구현합니다.

## 사전 조건

`FIGMA_ACCESS_TOKEN` 환경변수가 설정되어있는지 확인하고, 사용자 승인에 따라 `pnpm api:generate` 명령어를 실행합니다.

## 1. 컴포넌트 위치 결정

사용자에게 다음 사항을 질문합니다.

1. GitHub 이슈 번호 확인
2. Figma 노드 확인
3. OpenAPI 스펙 확인
   - 미구현시 백엔드측 이슈 생성 여부
   - MSW mock 으로 임시 조치 여부
4. 서비스 · 라우팅 경로 결정

## 2. Figma 노드 분석

각 노드에 대해 다음 정보를 분석하고 사용자에게 질문합니다.

```plain
mcp__figma__get_metadata(fileKey, nodeId)         # 트리 구조
mcp__figma__get_design_context(fileKey, nodeId)   # 개별 노드 정보
mcp__figma__get_variable_defs(fileKey, nodeId)    # 디자인 토큰
mcp__figma__get_screenshot(fileKey, nodeId)       # 시각 래퍼런스 (검증용)
```

1. 컴포넌트 트리 설계
   - 단일 통합 컴포넌트 지양
   - 유의미한 컴포넌트 단위로 분리
   - 컴포넌트별 props 인터페이스 설계
2. 기존 컴포넌트 재사용 확인
   - 확인 순서 : shadcn → `packages/ui`
   - 재사용 불가시 신규 컴포넌트 생성
3. Figma 컴포넌트 Variant 탐색
   - 각 Variant에 대해 별도 노드 분석

Figma 컴포넌트가 다음 목록 중 일부 Variant를 보유하지 않은 경우 사용자에게 보고하세요.

Variant 카테고리 :

- 데이터 상태: loading / empty / error
- 인터랙션: hover / focus / active / disabled
- 반응형: mobile / tablet / desktop
- 접근성: 키보드 / A11y

추가로 `get_variable_defs` 사항이 `global.css`에 모두 구현되어있는지 일대일로 비교하고, 누락된 토큰이 없다면 조용히 넘어가고 누락된 토큰이 존재하면 보고하세요.

### 3. 퍼블리싱

독립 컴포넌트는 병렬 에이전트로 동시에 구현합니다

1. 컴포넌트 생성
2. 페이지 생성

데이터 연결은 `integrate-api` 스킬을 통해 구현합니다.

## 참고 문서

- [개발 프로세스](../../../docs/how-to/development.md)
- [API 클라이언트](../../../docs/reference/package-api-client.md)
- [MSW 핸들러 패키지](../../../docs/reference/package-mocks.md)
