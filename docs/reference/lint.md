# Lint 관리

## Lint 구성

| 유형         | 파일                       | 목적                          |
| ------------ | -------------------------- | ----------------------------- |
| EsLint       | `base.js`                  | JS · TS · React · Next 프리셋 |
| EsLint       | `figma.js`                 | `@figma` 태그 형식 검증       |
| Prettier     | `.prettierrc`              | 코드 포매팅                   |
| markdownlint | `.markdownlint-cli2.jsonc` | 마크다운 문법 검사            |
| lychee       | `lychee.toml`              | 마크다운 링크 검사            |

## EsLint 적용 범위

| 패키지        | base.js | prettier | markdownlint | lychee | figma.js                  |
| ------------- | ------- | -------- | ------------ | ------ | ------------------------- |
| root          | ○       | ○        | ○            | ○      | X                         |
| apps/career   | ○       | ○        | ○            | ○      | `**/page.tsx`             |
| apps/plan     | ○       | ○        | ○            | ○      | `**/page.tsx`             |
| apps/company  | ○       | ○        | ○            | ○      | `**/page.tsx`             |
| packages/ui   | ○       | ○        | ○            | ○      | `src/components/**/*.tsx` |
| packages/push | ○       | ○        | ○            | ○      | X                         |

## 명령어

| 명령                | 대상                                           |
| ------------------- | ---------------------------------------------- |
| `pnpm lint`         | ESLint · Prettier · markdownlint · lychee 검사 |
| `pnpm lint:fix`     | ESLint · Prettier 수정                         |
| `pnpm api:generate` | Orval 클라이언트 생성 후 타입 검사             |
| `pnpm figma`        | 피그마 매핑 실행                               |
| `pnpm figma:dry`    | 피그마 매핑 dry-run                            |

## 파이프라인 통합

- 커밋 시 husky · lint-staged가 스테이징 파일에 `eslint --fix` · `prettier --write`를 적용합니다.

## 관련 문서

- [피그마 태그](./figma-tag.md)
- [개발 프로세스](../how-to/development.md)
- [문서 작성법](../how-to/write-docs.md)
