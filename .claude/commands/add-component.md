# shadcn 컴포넌트 추가

shadcn/ui 컴포넌트를 프로젝트에 추가합니다.

## 사용법

```
/add-component <ComponentName>
```

예: `/add-component Input`, `/add-component Dialog`

## 실행

1. `$ARGUMENTS`로 컴포넌트명 확인 (예: Input, Card, Dialog)
2. shadcn/ui 공식 사이트에서 Tailwind v4 버전 코드 가져오기
   - URL: `https://ui.shadcn.com/docs/components/<component-name>`
3. `packages/ui/src/components/ui/<ComponentName>.tsx` 파일 생성
4. 필요한 Radix UI 의존성 확인 및 설치
   - `pnpm add <dependency> --filter @morton/ui`
5. `packages/ui/src/components/index.ts`에 export 추가
6. 빌드 테스트: `pnpm build:career`

## 컴포넌트 파일 컨벤션

- 파일명: UpperCamelCase (예: `Button.tsx`, `DatePicker.tsx`)
- import 경로: `../../lib/utils`에서 `cn` 함수 가져오기
- Tailwind v4 + OKLCH 색상 포맷 사용

## 자주 사용하는 컴포넌트

- Input, Label, Card, Dialog, Form
- Select, Checkbox, RadioGroup
- Tabs, Accordion, Sheet
- Toast, Tooltip, Popover

## 참고

- [shadcn/ui 공식](https://ui.shadcn.com)
- [Tailwind v4 문서](https://ui.shadcn.com/docs/tailwind-v4)
- SHADCN_PLAN.md 파일에서 진행 상황 추적
