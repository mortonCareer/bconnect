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
2. 개발자가 `figma-mapping.json`에 URL 추가
3. `/figma-sync [컴포넌트명]` 또는 `/figma-sync [URL]` 실행
4. Claude가 Figma 디자인을 읽어 코드 생성/수정

### 매핑 파일

`figma-mapping.json`에서 컴포넌트별 Figma URL과 코드 경로 관리:

```json
{
  "components": {
    "Button": {
      "figmaUrl": "https://www.figma.com/design/xxx?node-id=123-456",
      "codePath": "src/components/ui/Button.tsx"
    }
  }
}
```

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
│   │   ├── ui/           # shadcn 컴포넌트
│   │   └── index.ts      # export
│   ├── lib/
│   │   └── utils.ts      # cn() 함수
│   └── styles/
│       └── globals.css   # CSS Variables
├── figma-mapping.json    # Figma ↔ 코드 매핑
└── components.json       # shadcn CLI 설정
```
