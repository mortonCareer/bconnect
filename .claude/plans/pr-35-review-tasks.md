# PR #35 리뷰 코멘트 작업 목록

> PR: feat(career): Figma 페이지 동기화 기능 및 회원가입 플로우 구현
> 리뷰어: @manamana32321
> 작성일: 2026-01-10
> 최종 업데이트: 2026-01-11

## 작업 상태 요약

| Phase   | 상태      | 설명                                |
| ------- | --------- | ----------------------------------- |
| Phase 1 | ✅ 완료   | 인프라/컨벤션 설정                  |
| Phase 2 | ✅ 완료   | npm 라이브러리 및 공통 유틸         |
| Phase 3 | ✅ 완료   | 공통 UI 컴포넌트 추출               |
| Phase 4 | ✅ 완료   | React Hook Form + Zod + 에러 핸들링 |
| Phase 5 | ✅ 완료   | Next.js 베스트 프랙티스             |
| Phase 6 | ⏳ 진행중 | 코드 구조 개선 (6.2 백엔드 대기)    |
| Phase 7 | ✅ 완료   | Icon 컴포넌트 분리 + API 타입 개선  |

---

## Phase 1: 인프라/컨벤션 설정

- [x] **1.1** Import alias 규칙 설정 `RESOLVED`
  - 3스텝 이상 상위 참조 시 `@` alias 사용
  - `auth/page.tsx`, `complete/page.tsx` 수정 완료

- [x] **1.2** 하드코딩 컬러 검사 체계 `RESOLVED`
  - Claude hook 추가 (`post-edit.sh`에 TSX 하드코딩 컬러 검사)
  - 전체 파일 하드코딩 컬러 체크 완료

- [x] **1.3** `/figma-lint` 커맨드 생성 `RESOLVED`
  - 컬러 스타일 하드코딩 검사
  - 프레임 이름 컨벤션 검사
  - `.claude/commands/figma-lint.md` 생성 완료

- [x] **1.4** `/figma-sync-page` 커맨드 규칙 업데이트 `RESOLVED`
  - `router.push` → `next/link` 사용
  - 이미지 → `next/image` 사용
  - 필요 시 `TODO.md` 생성
  - 컴포넌트화 규칙: 페이지 내 2회↑ → `components/`, 2페이지↑ → `packages/ui`
  - `page.tsx` 중첩 3단계 제한
  - `globals.css` 수정 금지 (개발자 검토 필수)
  - 계획 수립 후 개발자 검토 요청

---

## Phase 2: npm 라이브러리 조사 및 공통 유틸 추출

- [x] **2.1** 전화번호 포맷팅 라이브러리 조사 `RESOLVED`
  - `libphonenumber-js` 도입 결정
  - `packages/config/phone` 생성 완료

- [x] **2.2** `formatPhoneNumber`, `toE164` 공통 패키지 이전 `RESOLVED`
  - `packages/config/phone/index.ts` 생성
  - signup/auth, login 페이지 중복 코드 제거

---

## Phase 3: 공통 UI 컴포넌트 추출

- [x] **3.1** BackButton (뒤로가기 버튼) 추상화 `RESOLVED`
  - SVG 아이콘 포함 → ChevronLeftIcon 분리
  - `packages/ui/src/components/ui/BackButton.tsx` 생성

- [x] **3.2** ProgressBar (진행 표시줄) 추상화 `RESOLVED`
  - step, total props
  - `packages/ui/src/components/ui/ProgressBar.tsx` 생성

- [x] **3.3** Primary Button 컴포넌트화 `RESOLVED`
  - variant (primary, outline, ghost, destructive)
  - size (default, sm, lg, full)
  - isLoading, loadingText 지원
  - `packages/ui/src/components/ui/Button.tsx` 생성

---

## Phase 4: 폼 관리 개선

- [x] **4.1** React Hook Form 도입 `RESOLVED`
  - `react-hook-form` + `@hookform/resolvers` 설치
  - `signup/username/schema.ts` - Zod 스키마 정의
  - `signup/profile/schema.ts` - Zod 스키마 정의
  - 각 페이지에 RHF 적용 완료

- [x] **4.2** 에러 핸들링 구체화 `RESOLVED`
  - OpenAPI 스펙에 `ErrorCode` enum 추가
  - `ApiError` 클래스에서 타입 안전한 에러 코드 사용
  - OTP 발송 제한 에러 분기: `ErrorCode.OTP_RATE_LIMIT`
  - OTP 인증 실패 에러 분기: `ErrorCode.OTP_INVALID`, `OTP_EXPIRED`, `OTP_MAX_ATTEMPTS`
  - 전화번호 유효성 에러: `ErrorCode.INVALID_PHONE`

---

## Phase 5: Next.js 베스트 프랙티스 적용

- [x] **5.1** `router.push` → `next/link` 변경 `RESOLVED`
  - `complete/page.tsx` 수정 완료 (Link + buttonVariants 적용)
  - 기타 페이지 확인 완료

- [x] **5.2** 엔터키 submit 트리거 구현 `RESOLVED`
  - `auth/page.tsx` input에 onKeyDown 핸들러 적용 완료

- [x] **5.3** `router.back()` 대안 확인 `RESOLVED`
  - Next.js에서 네이티브 back API 없음, `router.back()` 유지

---

## Phase 6: 코드 구조 개선

- [x] **6.1** Feature-based 폴더 구조 적용 `RESOLVED`
  - `profile/` 페이지에 적용: types.ts, constants.ts, components/ 분리
  - 중첩 3단계 제한 준수

- [ ] **6.2** 마스터 데이터 ID 타입 변경 `PENDING - 백엔드 대기`
  - `ConstructionField` string → number
  - 현재 API 스키마에 시공분야 필드 없음
  - 백엔드 API 스키마 확정 후 진행

- [x] **6.3** `cn` 유틸 함수 사용 검토 `RESOLVED`
  - `@morton/ui`에서 `cn` export 추가
  - `profile/page.tsx` 조건부 클래스에 적용

- [x] **6.4** `complete/page.tsx` 라인 4 수정 `RESOLVED`
  - `useRouter` 제거 → `Link` 사용 (5.1에서 완료)

---

## Phase 7: Icon 컴포넌트 분리 + API 타입 개선

- [x] **7.1** Inline SVG를 Icon 컴포넌트로 분리 `RESOLVED`
  - `packages/ui/src/icons/ChevronLeftIcon.tsx`
  - `packages/ui/src/icons/CheckIcon.tsx`
  - `packages/ui/src/icons/UploadCloudIcon.tsx`
  - BackButton, signup/complete, instagram/upload 페이지 적용

- [x] **7.2** OpenAPI ErrorCode enum 추가 `RESOLVED`
  - `packages/api-client/src/openapi.yaml`에 ErrorCode, ErrorResponse 스키마 추가
  - Orval로 타입 자동 생성
  - auth/page.tsx에서 타입 안전한 에러 핸들링 적용

- [x] **7.3** Generated 코드 .gitignore 처리 `RESOLVED`
  - `packages/api-client/src/generated/` 추가
  - `postinstall` 스크립트로 자동 생성

---

## 커밋 히스토리

| 커밋    | 완료 항목          | 날짜       |
| ------- | ------------------ | ---------- |
| 26a2cde | 1.1, 1.2, 1.3, 1.4 | 2026-01-10 |
| cc8006e | 2.1, 2.2           | 2026-01-10 |
| 62bcbf6 | 3.1, 3.2, 3.3      | 2026-01-10 |
| 3e223cb | 5.1, 5.2, 5.3      | 2026-01-10 |
| 2bd16a4 | 6.3, 6.4           | 2026-01-10 |
| da0288d | 6.1                | 2026-01-10 |
| 4dce8bc | 4.1                | 2026-01-11 |
| dd39578 | 7.1                | 2026-01-11 |
| 1c16d10 | 4.2, 7.2, 7.3      | 2026-01-11 |

---

## GitHub 코멘트 매핑

| 코멘트 ID  | 파일                 | 내용 요약                  | 상태   |
| ---------- | -------------------- | -------------------------- | ------ |
| 2678430500 | auth/page.tsx        | Import alias 규칙          | ✅ 1.1 |
| 2678431637 | auth/page.tsx:19     | React Hook Form 도입       | ✅ 4.1 |
| 2678431904 | auth/page.tsx        | 공통 유틸 패키지 이전      | ✅ 2.2 |
| 2678432140 | auth/page.tsx        | npm 라이브러리 조사        | ✅ 2.1 |
| 2678432340 | auth/page.tsx        | toE164 로직 추출           | ✅ 2.2 |
| 2678434302 | auth/page.tsx:72     | OTP 발송 제한 에러 분기    | ✅ 4.2 |
| 2678434511 | auth/page.tsx:72     | 발송 제한 초과 로직 확인   | ✅ 4.2 |
| 2678434842 | auth/page.tsx:106    | 인증 실패 에러 분기        | ✅ 4.2 |
| 2678457383 | auth/page.tsx:160    | 엔터키 submit 트리거       | ✅ 5.2 |
| 2678460016 | auth/page.tsx        | Button 컴포넌트 추출       | ✅ 3.3 |
| 2678460265 | complete/page.tsx    | useRouter 제거 (next/link) | ✅ 6.4 |
| 2678460660 | complete/page.tsx    | next/link 사용             | ✅ 5.1 |
| 2678460860 | complete/page.tsx    | SVG 추상화                 | ✅ 7.1 |
| 2678461537 | complete/page.tsx:18 | 하드코딩 컬러 경고 체계    | ✅ 1.2 |
| 2678461783 | complete/page.tsx:18 | 전체 파일 컬러 체크        | ✅ 1.2 |
| 2678462264 | profile/page.tsx     | RHF 공통 관리              | ✅ 4.1 |
| 2678463023 | profile/page.tsx     | Zod schema 사용            | ✅ 4.1 |
| 2678463536 | profile/page.tsx     | router.back() 대안         | ✅ 5.3 |
| 2678463794 | profile/page.tsx     | BackButton 추상화          | ✅ 3.1 |
| 2678464055 | profile/page.tsx     | ProgressBar 추상화         | ✅ 3.2 |
| 2678464432 | profile/page.tsx:111 | 하드코딩 컬러 지양         | ✅ 1.2 |
| 2678466838 | profile/page.tsx:111 | Claude hook 도입           | ✅ 1.2 |
| 2678473169 | profile/page.tsx:111 | figma-lint 커맨드          | ✅ 1.3 |
| 2678473477 | profile/page.tsx     | 마스터 데이터 관리 TODO    | ⏳ 6.2 |
| 2678473849 | profile/page.tsx:178 | Button 추상화              | ✅ 3.3 |
| 2678475042 | profile/page.tsx:111 | 중첩 3단계 제한            | ✅ 6.1 |
| 2678475513 | profile/page.tsx:111 | figma-sync 검토 요청       | ✅ 1.4 |
| 2678476086 | profile/page.tsx     | 마스터 데이터 ID 타입      | ⏳ 6.2 |
| 2678476499 | profile/page.tsx     | cn 유틸 함수 사용          | ✅ 6.3 |
| 2678477097 | profile/page.tsx     | cn 유틸 figma-sync 추가    | ✅ 6.3 |

---

## 남은 작업

1. **6.2 마스터 데이터 ID 타입 변경** - 백엔드 API 스키마 확정 대기
   - `ConstructionField`, `ExperienceLevel` 등의 ID를 string → number로 변경
   - 백엔드에서 마스터 데이터 API 추가 시 반영
