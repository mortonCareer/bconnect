# 피그마 태그

> 대상: FE 개발자<br>
> 학습 목표: `@figma` JSDoc 태그로 컴포넌트와 Figma 노드에 대한 매핑 정보를 관리할 수 있다<br>
> 위치: `apps/career`, `apps/plan`, `apps/company`, `packages/ui`

피그마 태그를 활용하는 방법에 대해 설명합니다.
피그마 태그를 활용할 경우 ESLint 플러그인을 활용할 수 있습니다.
누락 사항에 대한 주간 보고서도 받아볼 수 있습니다.

## 태그 작성 현황

| 구역           | 컴포넌트 | 태그 ○ | 태그 × | 페이지 | 태그 ○ | 태그 × | tsx 파일 |
| -------------- | -------- | ------ | ------ | ------ | ------ | ------ | -------- |
| `apps/career`  | 53       | 7      | 46     | 30     | 30     | 0      | 83       |
| `apps/plan`    | 44       | 4      | 40     | 9      | 9      | 0      | 53       |
| `apps/company` | 38       | 0      | 38     | 5      | 5      | 0      | 43       |
| `apps`         | 135      | 11     | 124    | 44     | 44     | 0      | 179      |
| `packages/ui`  | 82       | 80     | 2      | 0      | 0      | 0      | 82       |
| 그 외          | 44       | 1      | 43     | 0      | 0      | 0      | 44       |
| 전체           | 261      | 92     | 169    | 44     | 44     | 0      | 305      |

## 태그 작성법

- 각 페이지 · 컴포넌트 파일 상단에 인라인 JSDoc 주석으로 Figma 프레임을 일대일 매핑
- ESLint Custom Rule `figma/figma-tag`로 누락을 빌드에서 차단
- [figma-mapping.md](./figma-mapping.md)가 매주 변경사항 감지
- URL 형식은 `https://www.figma.com/design/<fileKey>?node-id=<nodeId>`
- Morton 디자인 파일의 `<fileKey>`는 `EFXofON7gTFbmbE2kB31SS`

매핑된 Figma 노드. 여러 상태를 구현하는 파일은 줄을 나눠 여러 개 작성한다.

```tsx
/**
 * @figma <url>
 * @figma <url>
 */
```

매핑할 노드가 없는 경우. 디자인 미착수, 코드 전용 컴포넌트, 외부 원본 이식 등.

```tsx
/**
 * @figma-todo <description>
 * @figma-todo <description>
 */
```

### ESLint 강제 범위

`figma/figma-tag` rule 은 `packages/config/eslint/figma.js`에 정의되어 있습니다. 다음 파일에서 누락 시 error 입니다.

- `apps/*/src/**/page.tsx` : 3개 앱의 모든 Next.js 페이지
- `packages/ui/src/components/**/*.tsx` : 디자인 시스템 컴포넌트

`@figma`, `@figma-todo` 둘 중 하나는 필수입니다.

아래는 enforce 대상 외이며 선택 사항입니다.

- 내부 컴포넌트 `apps/*/src/app/.../_components/*.tsx`
- 아이콘 `packages/ui/src/icons/*.tsx`

### Node ID 찾는 법

- Figma URL 의 `?node-id=574-4554` 형태를 그대로 사용
- Figma desktop·web 에서 frame 우클릭 후 "Copy link"
- Claude Code 에서 자유 탐색 시 figma MCP 사용. `mcp__figma__get_metadata`, `mcp__figma__use_figma`

## 정적 감지도구

`@figma` JSDoc 태그를 두 도구가 각각 다른 축으로 검사합니다.

범위 :

- `apps/career`
- `apps/plan`
- `apps/company`
- `packages/ui`

범위 내 `.ts`·`.tsx` 374개 중 lint 대상은 97개, 태그 보유는 135개입니다. lint 대상은 figma-mapping 대상의 부분집합입니다.

### lint

- 대상 : `**/page.tsx`, `**/src/components/**/*.tsx`
- 검증 : 태그 존재 · 형식. Figma를 조회하지 않음
  - `missing` : 태그 없음
  - `invalid` : 형식 오류

### figma-mapping

- 대상 : 범위 내 `@figma` 태그를 포함한 `.ts`·`.tsx` 파일. lint 비대상 경로인 `icons/`·`_components/` 포함
- 검증 : 코드와 노드 양방향 대조
  - `not-found` : 컴포넌트 있으나 노드 없음
  - `not-ready` : 컴포넌트 있으나 Ready for dev 아님
  - `unmapped-node` : Ready for dev 노드 있으나 컴포넌트 없음
- 스크립트 : `scripts/figma-mapping/`

### 페이지

`**/page.tsx`

| 페이지         | 디자인    | lint      | figma-mapping   | 결과            | 비고               |
| -------------- | --------- | --------- | --------------- | --------------- | ------------------ |
| `@figma`       | -         | ○         | `not-found`     | `not-found`     | 노드 삭제됨        |
| `@figma`       | not ready | ○         | `not-ready`     | `not-ready`     | 디자인 대기        |
| `@figma`       | ready     | ○         | ○               | -               | 정상               |
| 태그 ×         | -         | `missing` | ○               | `missing`       | 페이지는 태그 필수 |
| 태그 ×         | not ready | `missing` | ○               | `missing`       | 페이지는 태그 필수 |
| 태그 ×         | ready     | `missing` | `unmapped-node` | `missing`       | 페이지는 태그 필수 |
| -              | not ready | -         | ○               | -               | 디자인 대기        |
| -              | ready     | -         | `unmapped-node` | `unmapped-node` | 구현 누락          |
| `@figma-todo`  | 추적 불가 | ○         | ○               | -               | 개발자 관리        |
| 태그 형식 오류 | 추적 불가 | `invalid` | ○               | `invalid`       | 형식 수정          |

### 컴포넌트 (lint 대상)

`**/src/components/**/*.tsx`

| 컴포넌트       | 디자인    | lint      | figma-mapping   | 결과            | 비고             |
| -------------- | --------- | --------- | --------------- | --------------- | ---------------- |
| `@figma`       | -         | ○         | `not-found`     | `not-found`     | 노드 삭제됨      |
| `@figma`       | not ready | ○         | `not-ready`     | `not-ready`     | 디자인 대기      |
| `@figma`       | ready     | ○         | ○               | -               | 정상             |
| `@figma` 중복  | not ready | ○         | `not-ready`     | `not-ready`     | 파일 수만큼 중복 |
| `@figma` 중복  | ready     | ○         | ○               | -               | 사각지대         |
| 태그 ×         | 무관      | `missing` | -               | `missing`       | 태그 필수        |
| -              | ready     | -         | `unmapped-node` | `unmapped-node` | 구현 누락        |
| `@figma-todo`  | 추적 불가 | ○         | ○               | -               | 개발자 관리      |
| 태그 형식 오류 | 추적 불가 | `invalid` | ○               | `invalid`       | 형식 수정        |

### 컴포넌트 (lint 비대상)

`icons/`·`_components/` 등이 해당합니다. 태그는 선택입니다. 붙이면 figma-mapping이 검사합니다.

| 컴포넌트       | 디자인    | lint | figma-mapping   | 결과            | 비고                 |
| -------------- | --------- | ---- | --------------- | --------------- | -------------------- |
| `@figma`       | -         | -    | `not-found`     | `not-found`     | 노드 삭제됨          |
| `@figma`       | not ready | -    | `not-ready`     | `not-ready`     | 디자인 대기          |
| `@figma`       | ready     | -    | ○               | -               | 정상                 |
| 태그 ×         | -         | -    | ○               | -               | 디자인 없는 컴포넌트 |
| 태그 ×         | not ready | -    | ○               | -               | 사각지대             |
| 태그 ×         | ready     | -    | `unmapped-node` | `unmapped-node` | 구현 누락            |
| `@figma-todo`  | 추적 불가 | -    | ○               | -               | 개발자 관리          |
| 태그 형식 오류 | 추적 불가 | -    | ○               | -               | 사각지대             |

## 참조

- ESLint plugin: [packages/config/eslint/figma.js](../../packages/config/eslint/figma.js)
- Figma Mapping Script: [figma-mapping.md](./figma-mapping.md)
- Figma CI : [.github/workflows/figma-mapping.yml](../../.github/workflows/figma-mapping.yml)
