# @bconnect/ui

Morton 공용 UI 컴포넌트 패키지. [shadcn/ui](https://ui.shadcn.com) 기반.

## 사용법

```tsx
import { Input } from '@bconnect/ui'
import '@bconnect/ui/styles'
```

---

## Figma ↔ 코드 매핑 (인라인 `@figma` JSDoc)

각 `page.tsx`/공통 컴포넌트 파일 상단의 인라인 JSDoc 주석으로 Figma frame과 코드를 1:1 매핑. ESLint custom rule(`bconnect-figma/require-figma-tag`)이 누락을 빌드에서 차단하고, [scripts/figma-checks/](../../scripts/figma-checks/CLAUDE.md)가 매주 cron으로 drift 자동 감지.

### 마커 4가지

#### 1. 정상 매핑 — `@figma`

```tsx
/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1239-7050
 */
'use client'

export default function EditAboutPage() { ... }
```

- URL 형식: `https://www.figma.com/design/<fileKey>?node-id=<nodeId>` (하이픈 형식)
- `<fileKey>` Morton 디자인 파일: `EFXofON7gTFbmbE2kB31SS`
- 한 파일에 `@figma`는 하나만

#### 2. 디자인 없이 임의 스캐폴딩 — `@figma-scaffold`

쇼케이스/PoC/임시 페이지처럼 디자인 없이 만든 경우. **사유 또는 이슈 링크 필수**.

```tsx
/**
 * @figma-scaffold 원클릭 조회 PoC — 백엔드 검증용, 디자인 미정 (#284)
 */
```

#### 3. 디자인 작업 대기 중 — `@figma-pending`

디자이너가 디자인 중이거나 곧 추가될 페이지.

```tsx
/**
 * @figma-pending 회원가입 - 업체 생성 (Sprint 2 예정, #TBD)
 */
```

#### 4. 다중 state/tab — `@figma-state` (옵션)

같은 페이지의 추가 상태(loading/error/empty/탭 변형). `@figma`와 함께 사용.

```tsx
/**
 * @figma https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1240-8132
 * @figma-state 경력증명서 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1240-8451
 * @figma-state 국가기술자격증 https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS?node-id=1387-9351
 */
```

- name은 Figma frame variant와 일치 권장 (한글, 공백 없이)
- 단일 state 페이지는 생략 (대다수 페이지는 `@figma` 한 줄로 충분)

### ESLint 강제 범위

`packages/config/eslint/plugin-figma.js` 정의 (`bconnect-figma/require-figma-tag` rule), 다음 파일에서 누락 시 error:

- `**/page.tsx` — 모든 Next.js 페이지
- `packages/ui/src/components/ui/*.tsx` — 디자인 시스템 공통 컴포넌트

`@figma`, `@figma-scaffold`, `@figma-pending` 셋 중 **하나는 필수**.

내부 컴포넌트 (`apps/*/src/app/.../_components/*.tsx`) 와 아이콘 (`packages/ui/src/icons/*.tsx`) 은 enforce 대상 외, 선택 사항.

### Node ID 찾는 법

- Figma URL: `?node-id=574-4554` 형태로 그대로 사용
- Figma desktop/web에서 frame 우클릭 → "Copy link"
- Claude Code에서 자유 탐색 시 figma MCP (`mcp__figma__get_metadata`, `mcp__figma__use_figma`)

### Figma 파일 구조 (Morton)

`EFXofON7gTFbmbE2kB31SS` 파일은 7개 page(canvas)로 구성:

| Page                   | Node ID     | 비고                    |
| ---------------------- | ----------- | ----------------------- |
| Brand                  | `799-2087`  | IR/슬라이드             |
| References & Drafts    | `118-645`   | 참조 자료               |
| Assets & Design System | `603-3460`  | 컬러/폰트/아이콘        |
| Sprint 1               | `603-4660`  | 초기 화면               |
| Sprint 1.5             | `1232-1833` | 프로필 confirm/redesign |
| Sprint 2               | `1415-1339` | Plan 앱 등              |
| 동산보드               | `978-4324`  | 작업 보드               |

각 page 안에 section → frame(개별 화면) 계층. 신규 sprint 추가 시 별도 page로 만들어지는 패턴.

---

## 디자인 토큰 (색상)

색 토큰은 [globals.css](src/styles/globals.css) `@theme`에 정의한다. SSOT는 **Figma Variables**이고 이 파일은 sync 결과물 — 토큰은 Figma에서 먼저 바꾸고 코드에 반영한다. 결정 근거: [ADR-0012](../../docs/explanation/adr/0012-design-system-ssot-figma.md).

### 2-layer 구조

| Layer         | 역할                                | 예                                       |
| ------------- | ----------------------------------- | ---------------------------------------- |
| **Primitive** | 원시 색 팔레트 (색 × 11단계 스케일) | `--color-primary-500`                    |
| **Semantic**  | 역할 토큰 — "이 색을 어디에 쓰나"   | `--color-primary`, `--color-destructive` |

- **Primitive** — brand 색(`primary`·`secondary`)만 `@theme`에 11단계(`50`~`950`)로 정의. 비-brand 색(`gray`·`red`·`orange`·`green` 등)은 Tailwind v4 기본 팔레트를 그대로 쓴다 (globals.css에서 재정의하지 않음).
- **Semantic** — shadcn 토큰 어휘(`background`·`foreground`·`border`·`primary`·`secondary`·`destructive`·`muted`·`ring` 등)를 그대로 쓰고, 값은 Primitive를 `var()`로 alias 한다. globals.css는 이들을 `surface`·`action`·`feedback`·`border` 주석 그룹으로 묶는다.
- 컴포넌트는 **semantic 토큰을 우선 소비**한다. primitive step 직접 사용(`bg-primary-600` 등)은 hover 등 특정 단계가 꼭 필요할 때만.

### 네이밍 규칙

- 모든 색 토큰은 `--color-` prefix (Tailwind v4 색 네임스페이스). `--bconnect-*` 같은 커스텀 prefix 금지.
- **Figma Variable 명 = `@theme` 변수명**, 글자 단위로 일치시킨다. 변환 규칙 없는 1:1 매핑 — drift 감지·검색을 단순하게.
- Figma의 group 구분은 CSS에서 하이픈으로 평탄화한다.

| Figma Variable | `@theme` 변수         | Tailwind 유틸      |
| -------------- | --------------------- | ------------------ |
| `primary/500`  | `--color-primary-500` | `bg-primary-500`   |
| `primary`      | `--color-primary`     | `bg-primary`       |
| `destructive`  | `--color-destructive` | `text-destructive` |

### 새 토큰 추가 절차

1. **디자이너** — Figma Variables에 등록 (primitive면 색×11단계, semantic이면 primitive를 가리키는 alias).
2. **FE** — [globals.css](src/styles/globals.css) `@theme`에 같은 이름으로 추가. primitive면 `50`~`950` 전부, semantic이면 `var()` alias 한 줄.
3. 컴포넌트에서 Tailwind 유틸(`bg-<token>` 등)로 사용.

- **System color**(feedback)는 사용처가 생길 때 추가한다. 현재 `destructive`(error)만 — `warning`/`success`/`info`는 미도입 (ADR-0012 §5).
- 다크모드는 1차 범위 외 (ADR-0012 §6) — `globals.css`에 `.dark` 스캐폴드만 유지(toggle 없어 비활성). 도입 시 `.dark` 블록의 semantic 값 검수 + theme provider 연결. 반응형 토큰도 미도입.

---

## 디렉토리 구조

```text
packages/ui/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── shadcn/          # shadcn registry vanilla — 재실행 안전 (소문자 파일명)
│   │   │   │   ├── accordion.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   └── label.tsx
│   │   │   ├── form/            # 우리 form-coupled wrapper — RHF context 소비
│   │   │   │   ├── TextField.tsx
│   │   │   │   ├── TextareaField.tsx
│   │   │   │   ├── FormError.tsx
│   │   │   │   └── FormSubmitButton.tsx
│   │   │   ├── _field-base.ts   # Input/Textarea 공통 클래스 SSOT (drift 차단)
│   │   │   ├── Button.tsx       # 디자인 시스템 base (Figma 시안 매핑)
│   │   │   └── ...              # 도메인 컴포넌트 (Chat*, Feed, TopBar 등)
│   │   └── index.ts             # barrel export
│   ├── icons/                   # 아이콘 컴포넌트
│   ├── hooks/                   # useServerError, useAllFieldsFilled 등
│   ├── lib/utils.ts             # cn() 함수
│   └── styles/globals.css       # CSS Variables + 디자인 시스템 @figma URL
└── components.json              # shadcn CLI 설정 (ui alias → src/components/ui/shadcn)
```

---

## 폼 시스템 (ADR 0013, PR #403)

상세: [`docs/how-to/frontend-forms.md`](../../docs/how-to/frontend-forms.md), [ADR 0013](../../docs/explanation/adr/0013-form-handling-standard.md).

### 표준 컴포넌트·훅

| 자리                 | 사용                                                          |
| -------------------- | ------------------------------------------------------------- |
| 폼 컨테이너          | `<Form {...form}>` (FormProvider alias)                       |
| 텍스트 입력          | `<TextField>` (단일), `<TextareaField>` (멀티)                |
| 폼 전역 에러 슬롯    | `<FormError error={server.formError} />`                      |
| 제출 버튼            | `<FormSubmitButton isLoading={mutation.isPending}>`           |
| 폼 외 단일 버튼      | `<Button isLoading={...}>` — `loadingText` 폐기, spinner 통일 |
| 서버 에러 derive     | `useServerError(control, mapError)`                           |
| 기본 mapError        | `passthroughError(field?)` — BE message 그대로 (ADR-0015)     |
| 특수 분기 type guard | `isApiErrorShape(err)`                                        |

### DO

- zod = 검증 SSOT. `useForm({ resolver: zodResolver(schema), mode: 'onTouched' })` — blur 후 첫 검증·이후 onChange 갱신. `isValid` 게이팅 버튼은 유지하면서 첫 타이핑 중 naggy 회피
- 폼 안 제출 버튼은 예외 없이 `FormSubmitButton`. 기본 게이트는 `formState.isValid` — 스키마를 통과해야 활성이므로 호출부에서 `disabled={!isValid}` 를 따로 쓰지 않는다 (#993). 한 폼을 여러 단계로 나눠 제출하는 화면(OTP phone → code 등)만 `requireValid={false}` + `disabled` 직접 지정
- 비활성 상태 회색은 `Button` 의 `disabled:bg-gray-100` 이 담당 — `variant={isValid ? 'primary' : 'secondary'}` 같은 토글 금지
- `coerce`/`transform` 스키마는 `useForm<input, ctx, output>` 3-제네릭
- 필수 필드는 `<TextField required>` — 라벨 옆 빨간 별표 자동 (HTML native required 는 발동 안 함, zod 가 검증)
- FormProvider 의존 컴포넌트는 런타임 가드 `if (!formContext) throw` (TS 강제 불가)
- Input·Textarea 등 폼 필드 base 클래스는 [`_field-base.ts`](src/components/ui/_field-base.ts) 의 `FIELD_*` 상수 사용

### DON'T

- raw `<input>`/`<textarea>` 폼 입력 (a11y 누락 위험)
- raw `<button type="submit">` (FormSubmitButton 또는 Button isLoading)
- `setError('root')` 또는 onChange 마다 `clearErrors` — [#369](https://github.com/mortonCareer/bconnect/pull/369) 버그 클래스
- `form.watch()` 호출 — `useWatch` 훅 사용 (React Compiler 호환)
- `packages/ui` 가 `@bconnect/api-client` 에 import 의존 — duck typing (`isApiErrorShape`)
- shadcn primitive (`ui/shadcn/*`) 직접 수정 — 확장은 wrapper 에서 (예: `TextField` 가 `TextFieldControl` 로 aria 흡수)
- `text-bconnect-*` prefix 사용 — globals.css 에 정의 없는 미정의 토큰 (Tailwind 무시)

---

## 관련 도구

- ESLint plugin: [packages/config/eslint/plugin-figma.js](../../packages/config/eslint/plugin-figma.js)
- 자동 drift 감지 CI: [scripts/figma-checks/CLAUDE.md](../../scripts/figma-checks/CLAUDE.md)
