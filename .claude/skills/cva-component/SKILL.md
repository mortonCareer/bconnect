# CVA 컴포넌트 템플릿

Class Variance Authority (CVA) + Tailwind CSS 패턴으로 React 컴포넌트를 생성합니다.

## 사용 시점

- 디자인 시스템 컴포넌트 생성 시
- variants가 있는 재사용 가능한 UI 컴포넌트 생성 시

---

## 필수 참조

> **중요:** 컴포넌트 생성 시 반드시 [UX_PRINCIPLES.md](./UX_PRINCIPLES.md)를 참조하여 인터랙션 스타일을 적용합니다.

---

## 파일 구조

```text
packages/ui/src/components/ui/
├── Button.tsx          # CVA 컴포넌트
├── Tag.tsx
└── ...

packages/ui/src/components/index.ts  # export 추가
```

---

## 컴포넌트 템플릿

```typescript
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

/**
 * ComponentName variants:
 * - variant1: 설명
 * - variant2: 설명
 */
const componentVariants = cva(
  // 기본 클래스 (모든 variants에 공통 적용)
  // UX_PRINCIPLES.md 참조하여 인터랙션 스타일 적용
  [
    'inline-flex items-center justify-center',
    'transition-all',                                    // 부드러운 전환
    'cursor-pointer',                                    // Affordance
    'active:scale-[0.98]',                              // Feedback
    'focus-visible:outline-none',                        // 접근성
    'focus-visible:ring-2 focus-visible:ring-[#386DFF]',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-white border border-gray-200 text-gray-900',
        primary: 'bg-[#386DFF] text-white',
        // Figma variants에서 추출
      },
      size: {
        default: 'h-10 px-4 text-sm',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ComponentNameProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,  // 또는 적절한 HTML 요소
    VariantProps<typeof componentVariants> {
  // 추가 props (필요한 경우)
}

const ComponentName = React.forwardRef<HTMLButtonElement, ComponentNameProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        type="button"
        className={cn(componentVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
ComponentName.displayName = 'ComponentName'

export { ComponentName, componentVariants }
```

---

## 기본 클래스 체크리스트

모든 인터랙티브 컴포넌트에 포함해야 하는 클래스:

| 클래스                 | 용도           | UX 원칙    |
| ---------------------- | -------------- | ---------- |
| `transition-all`       | 부드러운 전환  | 반응 시간  |
| `cursor-pointer`       | 클릭 가능 표시 | Affordance |
| `active:scale-[0.98]`  | 클릭 피드백    | Feedback   |
| `focus-visible:ring-2` | 키보드 포커스  | 접근성     |
| `disabled:opacity-50`  | 비활성 상태    | 상태 표시  |

---

## Variants 정의 패턴

### 색상 기반 variants

```typescript
variant: {
  default: 'border-[#E5E5E5] bg-transparent text-[#A5A5A5]',
  primary: 'border-[#386DFF] bg-[#386DFF] text-white',
  secondary: 'border-[#F4F4F4] bg-[#F4F4F4] text-[#8A8A8A]',
  outline: 'border-[#386DFF] bg-transparent text-[#386DFF]',
}
```

### 크기 기반 variants

```typescript
size: {
  default: 'h-[50px] px-4 text-base',      // Figma default size
  sm: 'h-[40px] px-3 text-sm',
  lg: 'h-[60px] px-6 text-lg',
  full: 'h-[50px] w-full px-4 text-base',  // 전체 너비
}
```

---

## Props 인터페이스 패턴

### 기본 (Button)

```typescript
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
```

### 추가 props가 필요한 경우

```typescript
export interface TagProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof tagVariants> {
  onRemove?: () => void // 추가 기능
}
```

### div 기반 컴포넌트

```typescript
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}
```

---

## Export 규칙

### 컴포넌트 파일

```typescript
// Button.tsx 끝부분
export { Button, buttonVariants }
```

### index.ts 업데이트

```typescript
// packages/ui/src/components/index.ts
export { Button, buttonVariants } from './ui/Button'
export { Tag, tagVariants } from './ui/Tag'
// 새 컴포넌트 추가
```

---

## 실전 예시

### Tag 컴포넌트

```typescript
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const tagVariants = cva(
  'inline-flex items-center justify-center rounded-lg border text-sm ' +
  'transition-all cursor-pointer active:scale-[0.98] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#386DFF]',
  {
    variants: {
      variant: {
        default: 'border-[#E5E5E5] bg-transparent text-[#A5A5A5] font-medium',
        selected: 'border-[#386DFF] bg-[#EAEFFF] text-[#386DFF] font-semibold',
        filter: 'border-[#386DFF] bg-[#EAEFFF] text-[#386DFF] font-semibold gap-1',
      },
      size: {
        default: 'h-[40px] px-[14px]',
        sm: 'h-[32px] px-[10px] text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface TagProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tagVariants> {
  onRemove?: () => void
}

const Tag = React.forwardRef<HTMLButtonElement, TagProps>(
  ({ className, variant, size, children, onRemove, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (variant === 'filter' && onRemove) {
        onRemove()
      }
      onClick?.(e)
    }

    return (
      <button
        type="button"
        className={cn(tagVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        {children}
        {variant === 'filter' && <XIcon size={16} />}
      </button>
    )
  }
)
Tag.displayName = 'Tag'

export { Tag, tagVariants }
```

---

## 참조

- [UX 인터랙션 원칙](./UX_PRINCIPLES.md) - 필수 적용
- [Class Variance Authority](https://cva.style/)
- [Tailwind CSS](https://tailwindcss.com/)
- 예시: `packages/ui/src/components/ui/Button.tsx`
