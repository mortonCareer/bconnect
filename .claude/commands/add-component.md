# shadcn 컴포넌트 추가

shadcn/ui 컴포넌트를 프로젝트에 추가합니다.

## 사용법

```
/add-component <ComponentName> [ComponentName2] ...
```

예: `/add-component Input`, `/add-component Input Label Card Dialog`

## 실행

1. `$ARGUMENTS`로 컴포넌트명 확인 (예: Input, Card, Dialog)
2. packages/ui 디렉토리에서 shadcn CLI로 컴포넌트 추가:

   ```bash
   cd packages/ui && npx shadcn@latest add <component-name> --overwrite --yes
   ```

   - 여러 컴포넌트: `cd packages/ui && npx shadcn@latest add input label card --overwrite --yes`

3. 파일명 컨벤션 적용 (소문자 → UpperCamelCase로 rename)

   ```bash
   mv packages/ui/src/components/ui/input.tsx packages/ui/src/components/ui/Input.tsx
   ```

4. import 경로 수정: `src/lib/utils` → `../../lib/utils`
5. `packages/ui/src/components/index.ts`에 export 추가
6. 빌드 테스트: `pnpm build:career`

## 컴포넌트 파일 컨벤션

- 파일명: UpperCamelCase (예: `Button.tsx`, `DatePicker.tsx`)
- shadcn CLI는 소문자로 생성하므로 rename 필요
- import 경로: `../../lib/utils`에서 `cn` 함수 가져오기 (CLI가 생성한 `src/lib/utils` → 상대경로로 수정)

## 자주 사용하는 컴포넌트

- Input, Label, Card, Dialog, Form
- Select, Checkbox, RadioGroup
- Tabs, Accordion, Sheet
- Toast, Tooltip, Popover

## 참고

- [shadcn/ui 공식](https://ui.shadcn.com)
- [Tailwind v4 문서](https://ui.shadcn.com/docs/tailwind-v4)
- SHADCN_PLAN.md 파일에서 진행 상황 추적
