---
name: figma-to-component
description: Figma 디자인을 React 컴포넌트로 자동 변환. 레이어 구조 분석, Tailwind CSS 생성, shadcn/ui 스타일 컴포넌트 코드 생성
allowed-tools: Bash, Read, Write, Grep
---

# Figma to Component

Figma 디자인 파일을 분석하여 React 컴포넌트 코드를 자동 생성합니다.

## 사용 시점

- 새로운 디자인 시안을 컴포넌트로 구현할 때
- 디자인 토큰을 코드로 동기화할 때
- 퍼블리싱 작업을 자동화하고 싶을 때

---

## 기능

### 1. Figma API 연동

Figma REST API를 통해 디자인 데이터를 가져옵니다.

**필요한 정보:**

- Figma File Key (URL에서 추출)
- Figma Access Token (Personal Access Token)
- Node ID (특정 컴포넌트/프레임)

**API 엔드포인트:**

```bash
# 파일 정보 가져오기
GET https://api.figma.com/v1/files/:file_key

# 특정 노드 가져오기
GET https://api.figma.com/v1/files/:file_key/nodes?ids=:node_id

# 이미지 URL 가져오기
GET https://api.figma.com/v1/images/:file_key?ids=:node_id&format=svg
```

### 2. 레이어 구조 분석

Figma 노드 트리를 분석하여 React 컴포넌트 구조로 변환합니다.

**Figma 노드 타입 → React 엘리먼트 매핑:**

| Figma 타입 | React 엘리먼트  | 비고                    |
| ---------- | --------------- | ----------------------- |
| FRAME      | `<div>`         | 레이아웃 컨테이너       |
| GROUP      | `<div>`         | 그룹핑                  |
| TEXT       | `<p>`, `<span>` | 텍스트 노드             |
| RECTANGLE  | `<div>`         | 배경, 카드 등           |
| INSTANCE   | `<Component>`   | Figma 컴포넌트 인스턴스 |
| VECTOR     | `<svg>`         | 아이콘, 일러스트        |

### 3. Tailwind CSS 클래스 생성

Figma 스타일 속성을 Tailwind CSS 클래스로 변환합니다.

**스타일 변환 예시:**

```typescript
// Figma 속성
{
  fills: [{ color: { r: 1, g: 1, b: 1 } }],
  strokes: [{ color: { r: 0, g: 0, b: 0 } }],
  cornerRadius: 8,
  paddingLeft: 16,
  paddingTop: 8,
}

// Tailwind 클래스
"bg-white border border-black rounded-lg px-4 py-2"
```

**Auto Layout → Flexbox 변환:**

```typescript
// Figma Auto Layout
{
  layoutMode: "HORIZONTAL",
  primaryAxisAlignItems: "CENTER",
  counterAxisAlignItems: "CENTER",
  itemSpacing: 8,
}

// Tailwind
"flex flex-row items-center justify-center gap-2"
```

### 4. shadcn/ui 스타일 컴포넌트 생성

생성되는 컴포넌트는 프로젝트의 shadcn/ui 스타일을 따릅니다.

> **필수:** 컴포넌트 생성 시 반드시 [UX_PRINCIPLES.md](./UX_PRINCIPLES.md)를 참조하여 인터랙션 스타일을 적용합니다.

**컴포넌트 구조:**

```typescript
// Button.tsx (예시)
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// UX 원칙 적용: UX_PRINCIPLES.md 참조
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ' +
  'cursor-pointer transition-all active:scale-[0.98] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

---

## 환경 변수 설정

```bash
# .env
FIGMA_ACCESS_TOKEN=figd_xxxxxxxxxxxxx

# Vercel/Railway (프로덕션)
# 각 플랫폼 대시보드에서 환경 변수 추가
```

**Figma Access Token 발급:**

1. Figma 계정 설정 → "Personal Access Tokens"
2. "Generate new token" 클릭
3. 토큰 이름 입력 (예: "Morton Development")
4. 토큰 복사 후 안전하게 보관

---

## 사용 예시

### 예시 1: Button 컴포넌트 생성

**Figma:**

- File: `https://figma.com/file/ABC123/Design-System`
- Component: "Primary Button"
- Node ID: `123:456`

**생성되는 파일:**

```
packages/ui/components/ui/
├── Button.tsx        # 컴포넌트 코드
└── index.ts          # export
```

### 예시 2: Card 컴포넌트 생성

**Figma:**

- Component: "Card" (Header, Body, Footer 포함)
- Auto Layout: Vertical, 16px gap

**생성되는 컴포넌트:**

```typescript
// Card.tsx
export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('flex flex-col gap-4 rounded-lg border bg-card p-6', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />
}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return <h3 className={cn('text-2xl font-semibold leading-none', className)} {...props} />
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return <div className={cn('flex items-center pt-0', className)} {...props} />
}
```

---

## 디자인 토큰 추출

Figma 스타일을 디자인 토큰으로 추출합니다.

**추출되는 토큰:**

```typescript
// design-tokens.ts
export const colors = {
  primary: '#000000',
  secondary: '#6B7280',
  background: '#FFFFFF',
  foreground: '#1F2937',
  // ...
}

export const spacing = {
  '0': '0px',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  // ...
}

export const borderRadius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  // ...
}
```

**Tailwind 설정 업데이트:**

```javascript
// tailwind.config.ts
import { colors, spacing, borderRadius } from './design-tokens'

export default {
  theme: {
    extend: {
      colors,
      spacing,
      borderRadius,
    },
  },
}
```

---

## 주의사항

### DO ✅

- Figma에서 명확한 네이밍 사용 (PascalCase)
- Auto Layout 적극 활용
- Variants로 상태 정의 (Default, Hover, Disabled 등)
- Text Styles, Color Styles 사용
- 컴포넌트화 (재사용 가능한 단위로 분리)

### DON'T ❌

- 절대 위치 (Absolute positioning) 사용
- 임의의 숫자 사용 (4px, 8px 배수 준수)
- 하드코딩된 색상 (Color Styles 사용)
- 복잡한 레이어 구조 (최대 3-4 depth)

---

## 제한사항

### 현재 지원

- Auto Layout → Flexbox 변환
- 기본 스타일 (색상, 간격, 테두리 등)
- Text Styles → Tailwind Typography
- 단순 Vector → SVG

### 향후 지원 예정

- Complex Vector → 최적화된 SVG 컴포넌트
- Figma Variants → CVA variants 자동 매핑
- Animations → Framer Motion 통합
- Responsive 디자인 → Tailwind 반응형 클래스

---

## 문제 해결

### Figma API 에러

```bash
# 토큰 확인
curl https://api.figma.com/v1/me \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN"

# 파일 접근 권한 확인
curl https://api.figma.com/v1/files/:file_key \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN"
```

### Node ID 찾기

1. Figma에서 컴포넌트 선택
2. 우클릭 → "Copy link to selection"
3. URL에서 `node-id=123-456` 추출
4. `123-456` → `123:456` (하이픈을 콜론으로 변경)

---

## 다음 단계

컴포넌트 생성 후:

1. 생성된 코드 리뷰
2. [UX 인터랙션 원칙](./UX_PRINCIPLES.md) 적용 확인
3. Props 타입 확인 및 보완
4. Accessibility 속성 추가 (aria-\*, role 등)
5. Storybook 스토리 작성 (선택)
6. 테스트 작성 (선택)

---

## 참고 문서

- [UX 인터랙션 원칙](./UX_PRINCIPLES.md) - 컴포넌트 생성 시 필수 적용
- [Figma API Documentation](https://www.figma.com/developers/api)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [CVA (Class Variance Authority)](https://cva.style/)
