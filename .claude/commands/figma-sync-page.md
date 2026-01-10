# Figma 페이지 디자인 동기화

Figma 페이지(화면) 디자인을 읽어서 Next.js 페이지 코드를 생성/수정합니다.

## 사용법

```bash
/figma-sync-page <페이지명 | Figma URL>
```

예:

- `/figma-sync-page signup/auth` - 매핑 파일에서 URL 조회 후 동기화
- `/figma-sync-page https://www.figma.com/design/xxx?node-id=1-2` - URL 직접 지정

## 실행

### 1. 입력 파싱

`$ARGUMENTS` 확인:

- URL이면 → fileKey, nodeId 추출
- 페이지명이면 → `packages/ui/figma-mapping.json`의 `pages` 섹션에서 URL 조회

### 2. 매핑 파일 확인

```json
// packages/ui/figma-mapping.json
{
  "pages": {
    "signup/auth": {
      "figmaUrl": "https://www.figma.com/design/xxx?node-id=574-4649",
      "codePath": "apps/career/src/app/signup/auth/page.tsx",
      "states": [
        { "name": "phone", "nodeId": "574-4649" },
        { "name": "otp", "nodeId": "574-4660" },
        { "name": "otp-error", "nodeId": "574-4675" }
      ]
    }
  }
}
```

- `figmaUrl`이 없으면 → "Figma URL이 등록되지 않았습니다" 안내
- URL 직접 입력 시 → 매핑 파일에 자동 추가 여부 확인

### 3. Figma MCP로 디자인 읽기

```
get_design_context(fileKey, nodeId)
get_screenshot(fileKey, nodeId)
get_metadata(fileKey, nodeId)
```

### 4. 디자인 분석

- 레이아웃 구조 파악 (Auto Layout → flex, gap, padding)
- 사용된 컴포넌트 감지 (text field, button 등)
- 상태별 프레임이 있으면 조건부 렌더링 구조로 통합

### 5. 코드 생성/수정

- `codePath`에 해당하는 파일 생성 또는 수정
- `@morton/ui` 컴포넌트 import
- 상태 관리 코드 추가 (useState, useReducer 등)
- Tailwind 클래스로 스타일링

## 코드 생성 규칙 (필수)

### 네비게이션

- **`router.push()` 사용 금지** → `next/link`의 `Link` 컴포넌트 사용
- 프리렌더링 최적화를 위해 Link 사용 권장

### 이미지

- **`<img>` 태그 사용 금지** → `next/image`의 `Image` 컴포넌트 사용
- 이미지 최적화 자동 적용

### 컴포넌트화 규칙

- **한 페이지 내 2회 이상 사용**: 해당 페이지의 `components/` 폴더로 분리
  - 예: `signup/auth/components/PhoneInput.tsx`
- **두 페이지 이상에서 공통 사용**: `packages/ui`로 추출
  - 예: `packages/ui/src/components/Button.tsx`

### 폴더 구조 (Feature-based)

```
signup/auth/
├── page.tsx           # 라우트 엔트리 (최대 3단계 중첩)
├── components/        # 페이지 전용 컴포넌트
│   ├── PhoneStep.tsx
│   └── OtpStep.tsx
├── hooks/             # 페이지 전용 훅
│   └── useAuthForm.ts
└── utils/             # 페이지 전용 유틸
    └── phoneFormat.ts
```

### TODO 관리

- 추가 작업 필요 시 해당 폴더에 `TODO.md` 생성
- API 연동, 상태 관리 등 미완성 부분 기록

### 스타일 파일 수정

- **`globals.css` 수정 금지** - 반드시 개발자 검토 후 진행
- 새로운 컬러/변수 추가 시 개발자에게 제안 후 승인 받기

### 계획 수립

- 코드 생성 전 계획을 먼저 수립
- 개발자에게 검토 요청 후 진행

## 상태별 처리

매핑 파일에 `states` 배열이 있으면:

1. 각 상태의 nodeId로 디자인 읽기
2. 공통 요소와 상태별 요소 구분
3. 단일 page.tsx에 조건부 렌더링으로 통합

```tsx
// 예: signup/auth/page.tsx
const [step, setStep] = useState<'phone' | 'otp'>('phone')
const [error, setError] = useState<string | null>(null)

return (
  <>
    {step === 'phone' && <PhoneSection />}
    {step === 'otp' && <OtpSection error={error} />}
  </>
)
```

## Figma MCP 도구

- `get_design_context`: 노드의 코드 컨텍스트 가져오기
- `get_screenshot`: 노드 스크린샷 가져오기
- `get_metadata`: 노드 메타데이터 (구조) 가져오기
- `get_variable_defs`: Variables 정의 가져오기

## URL 파싱

```text
https://www.figma.com/design/ABC123/FileName?node-id=1-2
                            ^^^^^^           ^^^
                            fileKey          nodeId (1:2로 변환)
```

## 참고

- 매핑 파일: `packages/ui/figma-mapping.json`
- 컴포넌트 동기화: `/figma-sync` 커맨드 참조
- packages/ui/README.md에서 전체 워크플로우 확인
