# Morton

업체-기술자 연결 구인구직 플랫폼

## 기술 스택

| 영역     | 기술                       |
| -------- | -------------------------- |
| Frontend | Next.js, React, TypeScript |
| Styling  | Tailwind CSS               |
| State    | Zustand                    |
| Backend  | Spring Boot (별도 관리)    |
| Infra    | Docker, GitHub Actions     |

## 프로젝트 구조

```
morton/
├── apps/
│   ├── career/           # Next.js 웹앱 (PWA): 기술자 작업물 업로드 및 일감 매칭
│   ├── works/            # Next.js 웹앱 (PWA): 업체 구인 공고 등록 및 기술자 매칭, 공정표 관리
│   └── api/              # Spring Boot (별도 빌드)
├── packages/
│   └── ui/               # 공통 UI 컴포넌트
└── .github/workflows/    # CI/CD
```

## 시작하기

### 요구사항

- Node.js 24+
- pnpm 10+

### 설치

```bash
# 의존성 설치
pnpm install
```

### 스크립트

```bash
pnpm lint         # ESLint
pnpm format       # Prettier 포맷팅
pnpm format:check # 포맷 검사
```

## 컨벤션

### 브랜치

- `main` - 프로덕션
- `feat/*` - 기능 개발
- `fix/*` - 버그 수정
- `docs/*` - 문서
- `chore/*` - 설정/빌드
- `refactor/*` - 리팩토링

### 커밋 메시지

[Conventional Commits](https://www.conventionalcommits.org/) 사용

```
feat: 포트폴리오 업로드 기능 추가
fix: 이미지 리사이징 버그 수정
docs: README 업데이트
chore: ESLint 설정 변경
refactor: 인증 로직 개선
```

### 코드 스타일

- TypeScript strict 모드
- ESLint + Prettier 자동 포맷팅
- import 자동 정렬
- 컴포넌트: `UpperCamelCase.tsx`
- 유틸: `lowerCamelCase.ts`

## 팀

| 역할     | 담당               |
| -------- | ------------------ |
| CEO      | 백엔드 + 기획      |
| CTO      | 프론트엔드, 인프라 |
| 디자이너 | UI/UX              |
