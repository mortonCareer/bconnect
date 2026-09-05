# 프론트엔드 공통 처리

> 대상: 프론트엔드 개발자<br>
> 학습 목표: career, plan 서비스가 공유하는 프론트엔드 규칙을 확인한다<br>
> 위치: `apps/career`, `apps/plan`, `apps/company`

career·plan 두 Next.js App Router 앱의 공통 프론트엔드 규칙입니다.

- 각 앱 CLAUDE.md가 `@import`로 로드
- 파일명이 정확히 `CLAUDE.md`가 아니라 자동 로드 안 됨
- 명시 import한 career·plan만 로드
- `apps/api`는 Spring Framework, `apps/crawler`는 Python이라 작업 시 안 딸려옴
- 위반 시 dev 깨짐 또는 production 사고

## 인증 미들웨어 · Public routes

인증 면제 라우트는 `src/proxy.ts`의 `PUBLIC_EXACT`·`PUBLIC_PREFIX`로 정의합니다.

- 신규 public 페이지를 여기 추가 안 하면 redirect loop
- 실제 값은 각 앱 `src/proxy.ts` 확인
- Next 16부터 `middleware.ts`가 `proxy.ts`로 네이밍 변경

## URL state via nuqs

탭·필터·검색 state는 nuqs `useQueryState`를 씁니다. `useState`는 금지합니다.

- 근거는 URL 공유 · 새로고침 유지 · 뒤로가기 자연

`history` 옵션은 "뒤로가기가 무엇을 되돌려야 하나" 기준으로 고릅니다. 기본값은 `'replace'`입니다.

- `'replace'` : 화면 내부에서만 의미 있는 일시적 state. 탭·서브탭·필터·검색어가 해당
  - `'push'`로 두면 전환마다 히스토리가 쌓임
  - TopBar 뒤로가기 `router.back()`이 화면을 이탈하지 못하고 탭만 되돌림. #843, #869
- `'push'` : 뒤로가기로 되돌리는 것이 사용자 기대인 화면 전환급 state
  - 예. 갤러리 → 파일 뷰어 열기 `?file`, 폼 서브스텝 진입 `?step`
  - 이 경우 왜 push 인지 주석으로 남긴다

## Tailwind v4 design tokens

색상 hex 직접 사용은 금지입니다. CSS variables를 씁니다.

- `✗ bg-[#386dff]` → `✓ bg-primary`
- 토큰 위치는 `packages/ui/src/styles/globals.css`
- 신규 색상은 globals.css 먼저

## 인터랙션 스타일 · 클릭 가능 요소

모든 클릭 가능 요소는 상호작용 스타일을 가집니다. 클릭되는데 마우스·포커스·눌림 피드백이 없으면 버그입니다.

- 1순위는 디자인시스템 프리미티브 사용. `Button`·`Select`·`Tab`·`Fab`·`MenuButton` 등
  - 아래 스타일이 이미 내장
  - raw `<button>`·클릭 `<div>` 직접 작성은 불가피할 때만
- 불가피한 raw 클릭 요소엔 직접 추가
  - `cursor-pointer`. raw `<button>` 은 브라우저 기본이 `default` 라 명시 필요
  - hover 피드백. `hover:bg-gray-100` 등 배경·색 변경
  - `focus-visible:ring-1 focus-visible:ring-primary` 와 `outline-none`. 키보드 a11y
  - `active:` 눌림 피드백. 예 `active:scale-[0.98]`
  - `transition-colors`. hover·active 부드럽게
  - disabled 는 `disabled:opacity-40 disabled:cursor-not-allowed`. 필요시 `disabled:pointer-events-none`
  - 아이콘 전용 버튼은 `aria-label` 필수
  - `<button type="button">` 으로 폼 submit 오발 방지
  - 모바일 탭 타겟 44px 이상 권장. `h-11`
- 클래스 SSOT 가 있으면 우선. 예 `_field-base.ts`

## 도메인 enum·라벨 · `@bconnect/api-client` SSOT

값이 enum인 도메인 어휘는 api-client SSOT를 씁니다. `Trade` 등이 해당하고 mock도 포함합니다.

- 옵션은 `TRADE_LIST`, 라벨은 `TRADE_LABELS[t]` 파생
- 한글 하드코딩 금지
- 자체 옵션 배열 금지
- 별도 표시필드 `category` 금지
- `generated/`는 orval 산출물. 직접 수정 금지
- enum에 없는 값은 BE spec 이슈로 확장

## 에러 클래스 · `@bconnect/config/errors` SSOT

도메인 에러 클래스와 사용자 노출 카피는 [packages/config/errors/index.ts](../../packages/config/errors/index.ts)가 SSOT입니다.

## 폼 제출 버튼 · `FormSubmitButton`

RHF `<Form>` 안 제출 버튼은 `FormSubmitButton`을 씁니다. raw `<Button type="submit">`은 쓰지 않습니다.

- #400 표준. ESLint 강제

## 날짜·공통 데이터 유틸 · `@bconnect/config` 선확인

날짜 계산은 `@bconnect/config/date`가 SSOT입니다. 일수 차·더하기·월 경계 등이 대상입니다.

- 제공 함수는 `daysBetween`·`addDays`·`todayIso` 등
- 포맷·전화·주소·동의 항목도 `@bconnect/config/*`가 SSOT
- 앱 로컬에 `Date.parse` 직접 계산 헬퍼를 재작성하기 전에 공용 패키지를 먼저 확인
- 로컬 중복 헬퍼는 반올림·경계 처리 드리프트를 만듦. #985 리뷰에서 실측

## 네이밍 · 상태 관리

- 파일. 컴포넌트는 `UpperCamelCase.tsx`, 유틸은 `lowerCamelCase.ts`
- boolean prop 은 `is/has/can/should` 접두
- 상태 3분법
  - 서버는 TanStack Query generated hooks
  - 클라이언트는 Zustand
  - 폼은 react-hook-form + zod. [react-hook-form.md](../how-to/react-hook-form.md)
- `'use client'` 는 필요할 때만. hooks·이벤트·브라우저 API가 해당

## Env vars · `@bconnect/config/env`

Zod 검증된 `env` 객체를 사용합니다. `process.env.X` 직접 접근은 금지입니다.

- 주입 누락이 런타임까지 숨음

## 로컬 서버 가동 · OTP

아래 스킬 · 문서 참고

- [qa-login.md](../how-to/qa-login.md)

## Navigation · `<Link>`, `router.push` 금지

클릭 핸들러의 `router.push`·`router.replace`는 금지입니다.

- ESLint `no-restricted-syntax` CI 차단
- 대신 `<Link>` 사용. 버튼은 `<Button asChild>`
- 불가피한 imperative 는 핸들러 내부면 비대상. mutation onSuccess 등이 해당
- `router.back()` 허용

## 공유 화면 · `packages/features`의 `*View` 소비

career·plan 공통 화면은 `packages/features`의 `<도메인>View` 하나로 공유합니다. 공통 비중은 90% 수준입니다.

- 앱 로컬 재구현은 안티패턴. #541
- `*View`는 순수 표현. 앱이 데이터 fetch 해 `data` prop 으로 내림
- 셸은 `renderShell`. plan 은 생략 시 기본 `PanelShell`
- 액션·편집은 `actionSlot`·`editHrefs` 슬롯 주입. 부재 시 읽기전용
- mutation·공유는 앱측
- 여러 페이지가 쓰면 어댑터를 `_adapters/`로 분리. 단일이면 `page.tsx` 인라인
- features 폴더. 루트는 공개로 `*View`와 `index.ts`, `_parts/`는 내부

## 이미지 · private CloudFront는 plain `<img>`

`static.bconnect.to` S3 유저 업로드 이미지는 plain `<img>`를 씁니다.

- next/image `<Image>` 금지
- next.config `images.remotePatterns`에 `static.bconnect.to` 추가 금지
- next/image Optimizer는 서버 fetch라 브라우저 signed cookie를 못 실음
- private 접근 시 403. chats·credentials·storages 가 해당
- `<img>`는 브라우저가 쿠키 동봉
- `<Image>`는 정적 자산 전용. `/public`, import 가 해당
- CLS는 width/height 또는 aspect-ratio로 고정
- CloudFront URL·Signed Cookie 발급 구조는 [첨부 아키텍처](../../apps/api/docs/attachment-architecture.md)

## 참고 문서

- [ADR-0020](../explanation/adr/0020-dual-shell-view-sharing-rendershell-resolved-data.md) · 듀얼 셸 화면 공유
- [figma-tag.md](./figma-tag.md) · `@figma` 태그 · 매핑 감지 도구

---

## 디자인 토큰 (색상)

색 토큰은 [globals.css](../../packages/ui/src/styles/globals.css) `@theme`에 정의합니다.

- SSOT는 Figma Variables
- 이 파일은 sync 결과물
- 토큰은 Figma에서 먼저 바꾸고 코드에 반영

### 2-layer 구조

| Layer     | 역할                                | 예                                       |
| --------- | ----------------------------------- | ---------------------------------------- |
| Primitive | 원시 색 팔레트 (색 × 11단계 스케일) | `--color-primary-500`                    |
| Semantic  | 역할 토큰. "이 색을 어디에 쓰나"    | `--color-primary`, `--color-destructive` |

- Primitive. brand 색인 `primary`·`secondary`만 `@theme`에 11단계 `50`~`950`로 정의
  - 비-brand 색은 Tailwind v4 기본 팔레트를 그대로 씀. `gray`·`red`·`orange`·`green` 등
  - globals.css에서 재정의하지 않음
- Semantic. shadcn 토큰 어휘를 그대로 씀. `background`·`foreground`·`border`·`primary`·`secondary`·`destructive`·`muted`·`ring` 등
  - 값은 Primitive를 `var()`로 alias
  - globals.css는 이들을 `surface`·`action`·`feedback`·`border` 주석 그룹으로 묶음
- 컴포넌트는 semantic 토큰을 우선 소비
  - primitive step 직접 사용은 hover 등 특정 단계가 꼭 필요할 때만. `bg-primary-600` 등

### 네이밍 규칙

- 모든 색 토큰은 `--color-` prefix. Tailwind v4 색 네임스페이스
- `--bconnect-*` 같은 커스텀 prefix 금지
- Figma Variable 명과 `@theme` 변수명을 글자 단위로 일치시킴
  - 변환 규칙 없는 1:1 매핑
  - drift 감지·검색을 단순하게
- Figma의 group 구분은 CSS에서 하이픈으로 평탄화

| Figma Variable | `@theme` 변수         | Tailwind 유틸      |
| -------------- | --------------------- | ------------------ |
| `primary/500`  | `--color-primary-500` | `bg-primary-500`   |
| `primary`      | `--color-primary`     | `bg-primary`       |
| `destructive`  | `--color-destructive` | `text-destructive` |

### 새 토큰 추가 절차

1. 디자이너. Figma Variables에 등록. primitive면 색×11단계, semantic이면 primitive를 가리키는 alias
2. FE. [globals.css](../../packages/ui/src/styles/globals.css) `@theme`에 같은 이름으로 추가. primitive면 `50`~`950` 전부, semantic이면 `var()` alias 한 줄
3. 컴포넌트에서 Tailwind 유틸로 사용. `bg-<token>` 등

- System color인 feedback 은 사용처가 생길 때 추가
- 현재 error 인 `destructive`만 있음. `warning`·`success`·`info`는 미도입

---

## 디렉토리 구조

```text
packages/ui/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── shadcn/          # shadcn registry vanilla
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

## 폼 시스템 (PR #403)

상세는 [react-hook-form.md](../how-to/react-hook-form.md)를 참고합니다.

### 표준 컴포넌트·훅

| 자리                 | 사용                                                         |
| -------------------- | ------------------------------------------------------------ |
| 폼 컨테이너          | `<Form {...form}>`. FormProvider alias                       |
| 텍스트 입력          | `<TextField>` 단일, `<TextareaField>` 멀티                   |
| 폼 전역 에러 슬롯    | `<FormError error={server.formError} />`                     |
| 제출 버튼            | `<FormSubmitButton isLoading={mutation.isPending}>`          |
| 폼 외 단일 버튼      | `<Button isLoading={...}>`. `loadingText` 폐기, spinner 통일 |
| 서버 에러 derive     | `useServerError(control, mapError)`                          |
| 기본 mapError        | `passthroughError(field?)`. BE message 그대로                |
| 특수 분기 type guard | `isApiErrorShape(err)`                                       |

### DO

- zod 가 검증 SSOT
  - `useForm({ resolver: zodResolver(schema), mode: 'onTouched' })`
  - blur 후 첫 검증, 이후 onChange 갱신
  - `isValid` 게이팅 버튼은 유지하면서 첫 타이핑 중 naggy 회피
- 폼 안 제출 버튼은 예외 없이 `FormSubmitButton`
  - 기본 게이트는 `formState.isValid`
  - 스키마를 통과해야 활성이므로 호출부에서 `disabled={!isValid}` 를 따로 쓰지 않음. #993
  - 한 폼을 여러 단계로 나눠 제출하는 화면만 `requireValid={false}` 와 `disabled` 직접 지정. OTP phone → code 등이 해당
- 비활성 상태 회색은 `Button` 의 `disabled:bg-gray-100` 이 담당
  - `variant={isValid ? 'primary' : 'secondary'}` 같은 토글 금지
- `coerce`·`transform` 스키마는 `useForm<input, ctx, output>` 3-제네릭
- 필수 필드는 `<TextField required>`
  - 라벨 옆 빨간 별표 자동
  - HTML native required 는 발동 안 함. zod 가 검증
- FormProvider 의존 컴포넌트는 런타임 가드 `if (!formContext) throw`. TS 강제 불가
- Input·Textarea 등 폼 필드 base 클래스는 [_field-base.ts](../../packages/ui/src/components/ui/_field-base.ts) 의 `FIELD_*` 상수 사용

### DON'T

- raw `<input>`·`<textarea>` 폼 입력. a11y 누락 위험
- raw `<button type="submit">`. FormSubmitButton 또는 Button isLoading 사용
- `setError('root')` 또는 onChange 마다 `clearErrors`. [PR #369](https://github.com/mortonCareer/bconnect/pull/369) 버그 클래스
- `form.watch()` 호출. `useWatch` 훅 사용. React Compiler 호환
- `packages/ui` 가 `@bconnect/api-client` 에 import 의존. duck typing 인 `isApiErrorShape` 사용
- shadcn primitive `ui/shadcn/*` 직접 수정. 확장은 wrapper 에서. 예로 `TextField` 가 `TextFieldControl` 로 aria 흡수
- `text-bconnect-*` prefix 사용. globals.css 에 정의 없는 미정의 토큰이라 Tailwind 무시

---

## CVA 컴포넌트 패턴

variants 있는 컴포넌트는 [cva](https://cva.style/) 로 정의합니다.

- 색·타이포는 위 디자인 토큰만 사용. hex 금지
- 인터랙션 스타일은 [frontend-patterns.md](./frontend-patterns.md) §인터랙션 참조
- Props 는 HTML attributes 와 `VariantProps<typeof xVariants>` 확장
- input 류만 `React.forwardRef`

## 패널 구조

`(main)/layout.tsx`

- 좌측 패널 : `MemberSidebar`, `GuestSidebar`
- 본문 : `children`
  - `(main)/page.tsx`
- 우측 패널 : `PanelHost`
  - `?panel=` 쿼리 파라미터로 구동
  - `_components/panel/PanelHost`가 파라미터 해석 · 디스패치
  - `usePanelNav` 네이게이션
