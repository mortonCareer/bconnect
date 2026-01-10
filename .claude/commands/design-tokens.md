# 디자인 토큰 동기화

Figma Variables를 CSS Variables로 동기화합니다.

## 사용법

```
/design-tokens <figma-url>
```

예: `/design-tokens https://www.figma.com/design/xxx/File?node-id=1-2`

## 실행

1. `$ARGUMENTS`에서 Figma URL 파싱
2. Figma MCP `get_variable_defs` 도구로 Variables 가져오기
3. Variables 매핑 분석:
   - Color Variables → CSS color variables
   - Spacing Variables → CSS spacing variables
   - Typography Variables → CSS font variables
4. `packages/ui/src/styles/globals.css` 업데이트 제안
5. Light/Dark 모드 Variables 분리

## 현재 CSS Variables 구조

```css
:root {
  --background: oklch(...);
  --foreground: oklch(...);
  --primary: oklch(...);
  --primary-foreground: oklch(...);
  /* ... */
}

.dark {
  /* Dark mode overrides */
}

@theme inline {
  --color-background: var(--background);
  /* Tailwind v4 mappings */
}
```

## Figma → CSS 매핑 예시

| Figma Variable | CSS Variable   |
| -------------- | -------------- |
| `color/red`    | `--primary`    |
| `color/sub 1`  | `--secondary`  |
| `spacing/sm`   | `--spacing-sm` |

## 주의사항

- OKLCH 색상 포맷 사용
- Tailwind v4 @theme inline 블록도 함께 업데이트
- 기존 값과 충돌 여부 확인 후 적용
