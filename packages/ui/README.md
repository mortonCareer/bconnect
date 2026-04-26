# @morton/ui

Morton 공용 UI 컴포넌트 패키지. [shadcn/ui](https://ui.shadcn.com) 기반.

## 사용법

```tsx
import { Input } from '@morton/ui'
import '@morton/ui/styles'
```

## Figma 연동

Figma MCP를 활용한 단방향 디자인 동기화 워크플로우.

```
Figma → Claude (MCP) → 코드 생성/수정
```

### 워크플로우

1. 디자이너가 Figma 컴포넌트 URL 공유
2. 개발자가 컴포넌트 파일 상단에 인라인 `@figma <url>` JSDoc 주석 추가 ([figma-mapping](../../.claude/skills/figma-mapping/SKILL.md))
3. Claude가 Figma 디자인을 읽어 코드 생성/수정

### 매핑 형식

각 컴포넌트 파일 상단에 인라인 JSDoc:

```tsx
/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=187-607
 */
import { cva } from 'class-variance-authority'

export const Button = ...
```

ESLint custom rule(`morton-figma/require-figma-tag`)이 누락을 빌드에서 차단합니다. 자세한 형식과 옵션(`@figma-scaffold`, `@figma-pending`, `@figma-state`)은 [figma-mapping 스킬](../../.claude/skills/figma-mapping/SKILL.md) 참조.

### Claude 커맨드

| 커맨드                    | 설명                            |
| ------------------------- | ------------------------------- |
| `/add-component <name>`   | shadcn 컴포넌트 추가            |
| `/figma-sync <name\|url>` | Figma 디자인 동기화             |
| `/design-tokens <url>`    | Figma Variables → CSS Variables |

## 디렉토리 구조

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn 컴포넌트 (각 파일 상단에 @figma 주석 필수)
│   │   └── index.ts      # export
│   ├── icons/            # 아이콘 컴포넌트
│   ├── lib/
│   │   └── utils.ts      # cn() 함수
│   └── styles/
│       └── globals.css   # CSS Variables (디자인 시스템 @figma URL 포함)
└── components.json       # shadcn CLI 설정
```
