# Figma Code Connect 매핑

Figma 컴포넌트와 코드 컴포넌트를 연결합니다.

## 사용법

```
/code-connect <ComponentName> [figma-url]
```

예: `/code-connect Button https://www.figma.com/design/xxx/File?node-id=1-2`

## 실행

1. `$ARGUMENTS`에서 컴포넌트명과 Figma URL 파싱
2. Figma URL이 제공된 경우:
   - `get_code_connect_map` 도구로 기존 매핑 확인
   - `add_code_connect_map` 도구로 새 매핑 추가
3. `packages/ui/src/components/ui/<ComponentName>.figma.tsx` 파일 생성
4. Code Connect 설정 파일 업데이트 (`figma.config.json`)

## Code Connect 파일 구조

```tsx
// Button.figma.tsx
import figma from '@figma/code-connect'
import { Button } from './Button'

figma.connect(Button, '<figma-component-url>', {
  props: {
    variant: figma.enum('Variant', {
      Primary: 'default',
      Secondary: 'secondary',
      Destructive: 'destructive',
    }),
    size: figma.enum('Size', {
      Small: 'sm',
      Medium: 'default',
      Large: 'lg',
    }),
    label: figma.string('Label'),
  },
  example: (props) => (
    <Button variant={props.variant} size={props.size}>
      {props.label}
    </Button>
  ),
})
```

## Figma MCP 도구

- `get_code_connect_map`: 기존 Code Connect 매핑 조회
- `add_code_connect_map`: 새 Code Connect 매핑 추가
  - label: "React" (프레임워크)
  - source: 컴포넌트 파일 경로
  - componentName: 컴포넌트 이름

## 참고

- [Code Connect 문서](https://www.figma.com/developers/code-connect)
- shadcn Figma 라이브러리: https://www.figma.com/community/file/1342715840824755935
