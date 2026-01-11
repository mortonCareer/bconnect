# Figma 디자인 → Raw 코드 생성

Figma 디자인을 읽어서 Next.js 페이지 코드를 **있는 그대로** 생성합니다.
프로젝트 컨벤션 적용 없이, Figma 디자인을 1:1로 코드화합니다.

## 사용법

```bash
/figma-generate <페이지명 | Figma URL>
```

예:

- `/figma-generate 회원가입/인증`
- `/figma-generate https://www.figma.com/design/xxx?node-id=1-2`

## 실행 단계

### 1. 입력 파싱

`$ARGUMENTS` 확인:

- URL이면 → fileKey, nodeId 추출
- 페이지명이면 → `packages/ui/figma-mapping.json`의 `pages` 섹션에서 URL 조회

### 2. Figma MCP로 디자인 읽기

```
get_design_context(fileKey, nodeId)
get_screenshot(fileKey, nodeId)
```

### 3. 코드 생성

- Auto Layout → `flex`, `gap`, `padding` 클래스로 변환
- 컬러, 폰트 등 **하드코딩 허용**
- 단일 `page.tsx` 파일로 생성
- 기본 `useState` 사용

### 4. 파일 저장

- `codePath`에 해당하는 파일 생성
- 기존 파일이 있으면 덮어쓰기 전 확인

## 생성 규칙

### 허용 사항

- 하드코딩 컬러 (`#386DFF`, `text-[#1B1B1B]` 등)
- 하드코딩 사이즈 (`w-[100px]`, `h-[50px]` 등)
- Inline SVG
- 단순 `useState` 상태 관리
- `router.push()` 사용

### 생성하지 않는 것

- API 연동 코드
- 복잡한 비즈니스 로직
- 에러 핸들링

## 상태별 처리

매핑 파일에 `states` 배열이 있으면:

1. 각 상태의 nodeId로 디자인 읽기
2. 단일 page.tsx에 조건부 렌더링으로 통합

```tsx
const [step, setStep] = useState<'phone' | 'otp'>('phone')

return (
  <>
    {step === 'phone' && <div>...</div>}
    {step === 'otp' && <div>...</div>}
  </>
)
```

## 출력

생성 완료 후:

1. 생성된 파일 경로 출력
2. `/figma-refactor` 실행 안내

```
✅ 생성 완료: apps/career/src/app/signup/auth/page.tsx

프로젝트 컨벤션 적용이 필요합니다.
→ /figma-refactor 회원가입/인증
```

## 참고

- 매핑 파일: `packages/ui/figma-mapping.json`
- 리팩터링: `/figma-refactor` 커맨드
