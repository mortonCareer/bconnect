# Figma 생성 코드 → 프로젝트 스타일 적용

`/figma-generate`로 생성된 Raw 코드를 프로젝트 컨벤션에 맞게 리팩터링합니다.

## 사용법

```bash
/figma-refactor <페이지명 | 파일경로>
```

예:

- `/figma-refactor 회원가입/인증`
- `/figma-refactor apps/career/src/app/signup/auth/page.tsx`

## 실행 단계

### 1. 대상 파일 확인

- 페이지명 → `packages/ui/figma-mapping.json`에서 `codePath` 조회
- 파일경로 → 직접 사용

### 2. 리팩터링 계획 수립

아래 규칙들을 적용할 항목 목록 작성

### 3. 개발자 검토 요청

계획을 개발자에게 제시하고 승인 받기

### 4. 리팩터링 실행

승인된 항목만 적용

---

## 리팩터링 규칙

### 1. Import/Export

| 규칙                         | Before              | After           |
| ---------------------------- | ------------------- | --------------- |
| 2스텝+ 상위 참조 → `@` alias | `../../stores/auth` | `@/stores/auth` |

> Import 순서 정렬은 Prettier가 자동 처리 (post-edit hook)

### 2. Next.js 베스트 프랙티스

| 규칙       | Before                 | After                         |
| ---------- | ---------------------- | ----------------------------- |
| 네비게이션 | `router.push('/path')` | `<Link href="/path">`         |
| 이미지     | `<img src="...">`      | `<Image src="..." alt="...">` |
| 폼 submit  | 버튼 클릭만            | 엔터키 트리거 추가            |

> `router.back()`은 Next.js 네이티브 대안이 없으므로 유지

### 3. 스타일링

| 규칙          | Before            | After                        |
| ------------- | ----------------- | ---------------------------- |
| 하드코딩 컬러 | `text-[#386DFF]`  | `text-primary` 또는 CSS 변수 |
| 조건부 클래스 | 삼항연산자 문자열 | `cn()` 유틸 사용             |

> `globals.css` 수정 필요 시 → 개발자에게 제안 후 승인 받기

### 4. 컴포넌트화 및 아이콘

| 조건                | 액션                      |
| ------------------- | ------------------------- |
| 페이지 내 2회+ 사용 | `components/` 폴더로 분리 |
| 2페이지+ 공통 사용  | `packages/ui`로 추출      |

**Inline SVG 분리 규칙** (컴포넌트화와 동일):

| 조건                | 위치                              |
| ------------------- | --------------------------------- |
| 페이지 내 2회+ 사용 | `signup/auth/icons/CheckIcon.tsx` |
| 2페이지+ 공통 사용  | `packages/ui/src/icons/`로 추출   |

Icon 컴포넌트 예시:

```tsx
// packages/ui/src/icons/CheckIcon.tsx (또는 페이지/icons/)
export function CheckIcon({ size = 24, ...props }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" {...props}>
      ...
    </svg>
  )
}
```

### 5. 폴더 구조 (Feature-based)

```
signup/auth/
├── page.tsx           # 라우트 엔트리 (최대 3단계 중첩)
├── components/        # 페이지 전용 컴포넌트
├── icons/             # 페이지 전용 아이콘
├── hooks/             # 페이지 전용 훅
├── types.ts           # 타입 정의
├── constants.ts       # 상수
└── schema.ts          # Zod 스키마 (폼 사용 시)
```

- `page.tsx` 중첩 **3단계 제한**
- 초과 시 `components/`로 분리

### 6. 폼 관리

| 복잡도                     | 권장 방식             |
| -------------------------- | --------------------- |
| 3개 이하 필드              | `useState`            |
| 4개+ 필드 또는 복잡한 검증 | React Hook Form + Zod |
| 멀티페이지 데이터 공유     | Zustand store         |

Zustand store 위치: `src/stores/`

### 7. API 호출 및 에러 핸들링

**필수 규칙:**

1. 클라이언트 컴포넌트에서 API 호출은 **반드시 `@morton/api-client`** 사용
2. 에러 분기는 **반드시 `ErrorCode` enum 기반**으로 처리
3. raw string 에러 메시지 직접 사용 금지 → 개발자에게 에러 코드화 제안

```tsx
import { ApiError, ErrorCode, useSendOtp } from '@morton/api-client'

// ✅ 올바른 사용: api-client의 generated hook 사용
const sendOtp = useSendOtp()

try {
  await sendOtp.mutateAsync({ phone })
} catch (err) {
  if (err instanceof ApiError) {
    // ✅ 올바른 사용: ErrorCode enum 기반 분기
    switch (err.code) {
      case ErrorCode.OTP_RATE_LIMIT:
        setError('요청이 너무 많습니다.')
        break
      case ErrorCode.OTP_INVALID:
        setError('올바르지 않은 인증번호입니다.')
        break
      default:
        setError(err.message)
    }
  }
}
```

### 8. 공통 유틸

| 조건                | 액션                     |
| ------------------- | ------------------------ |
| npm 라이브러리 존재 | 라이브러리 도입 검토     |
| 2페이지+ 중복 로직  | `packages/config`로 이전 |

---

## 체크리스트

리팩터링 완료 후 확인:

- [ ] Import alias 규칙 준수
- [ ] `next/link`, `next/image` 사용
- [ ] 하드코딩 컬러 제거
- [ ] `cn()` 유틸 적용
- [ ] 컴포넌트 분리 완료
- [ ] 폴더 구조 정리
- [ ] `pnpm build` 성공
- [ ] `/figma-lint` 통과

---

## 참고

- 코드 생성: `/figma-generate` 커맨드
- 린트 검사: `/figma-lint` 커맨드
- 매핑 파일: `packages/ui/figma-mapping.json`
