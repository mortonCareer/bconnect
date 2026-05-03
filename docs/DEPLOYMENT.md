# 배포

Morton 프로젝트의 배포 환경 및 프로세스를 설명합니다.

---

## 배포 환경

Morton은 **2단계 배포 모델**을 사용합니다:

```
dev (개발 및 QA)  →  prod (프로덕션)
```

| 환경 | 목적          | 배포 방식         | URL                               |
| ---- | ------------- | ----------------- | --------------------------------- |
| dev  | PR 프리뷰, QA | PR 생성 시 자동   | `*.vercel.app` (프리뷰 도메인)    |
| prod | 실제 서비스   | main 머지 시 자동 | `bconnect.to`, `plan.bconnect.to` |

### dev 환경 (PR 프리뷰)

- **목적**: 기능 개발 후 QA 수행
- **배포 트리거**: PR 생성 또는 업데이트
- **배포 플랫폼**: Vercel (Frontend), Railway (Backend)
- **데이터**: 테스트 데이터 또는 Mock API
- **URL 예시**:
  - `https://morton-career-git-feat-123-<team>.vercel.app`
  - `https://morton-plan-git-feat-123-<team>.vercel.app`

### prod 환경 (프로덕션)

- **목적**: 실제 사용자 대상 서비스
- **배포 트리거**: main 브랜치 머지
- **배포 플랫폼**: Vercel (Frontend), Railway (Backend)
- **데이터**: 실제 프로덕션 데이터
- **URL**:
  - Career App: `https://bconnect.to`
  - Plan App: `https://plan.bconnect.to`
  - API: `https://api.bconnect.to`

---

## 배포 프로세스

### Frontend (Next.js)

#### PR 프리뷰 배포

```
PR 생성/업데이트
    ↓
Vercel 자동 빌드 시작
    ↓
빌드 성공 (1-2분)
    ↓
프리뷰 URL 생성
    ↓
GitHub PR 댓글에 링크 추가
    ↓
QA 진행
```

**Vercel 빌드 설정:**

```json
// vercel.json (예시)
{
  "buildCommand": "pnpm build:career",
  "outputDirectory": "apps/career/.next",
  "framework": "nextjs",
  "installCommand": "pnpm install"
}
```

#### 프로덕션 배포

```
PR 승인 + main 머지
    ↓
Vercel 프로덕션 빌드
    ↓
빌드 성공 (1-2분)
    ↓
bconnect.to / plan.bconnect.to 업데이트
    ↓
헬스체크 (자동)
    ↓
배포 완료 알림 (GitHub, Slack 등)
```

### Backend (Spring Boot)

#### Railway 배포

```
main 브랜치 머지
    ↓
Railway 자동 빌드
    ↓
./gradlew build 실행
    ↓
Docker 이미지 생성
    ↓
컨테이너 배포 (Blue-Green)
    ↓
헬스체크 통과
    ↓
트래픽 전환
```

**Railway 설정:**

```toml
# railway.toml (예시)
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "java -jar app.jar"
healthcheckPath = "/actuator/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
```

---

## 인프라 구성

### Vercel (Frontend)

**사용 목적**: Next.js 앱 호스팅

**주요 기능**:

- 자동 빌드 및 배포
- PR 프리뷰 환경
- CDN 및 Edge Network
- 환경 변수 관리
- Analytics

**프로젝트**:

- `morton-career` (Career 앱)
- `morton-plan` (Plan 앱)

**환경 변수 설정**:

Vercel Dashboard → Project Settings → Environment Variables

```
NEXT_PUBLIC_API_URL=https://api.bconnect.to
NEXT_PUBLIC_VERCEL_ENV=production
```

### Railway (Backend)

**사용 목적**: Spring Boot API 호스팅

**주요 기능**:

- Docker 기반 배포
- PostgreSQL 데이터베이스
- 자동 헬스체크
- 환경 변수 관리
- 로그 모니터링

**서비스**:

- `morton-api` (Spring Boot)
- `morton-db` (PostgreSQL)

**환경 변수 설정**:

```
DATABASE_URL=jdbc:postgresql://...
SPRING_PROFILES_ACTIVE=production
JWT_SECRET=***
```

### AWS (파일 스토리지 등)

**사용 목적**: 정적 파일 저장 및 배포

**주요 서비스**:

- **S3**: 사용자 업로드 파일 (프로필 이미지 등)
- **CloudFront**: S3 앞단 CDN
- **(향후) RDS**: 데이터베이스 (Railway 대체 고려)

**S3 버킷 구조**:

```
morton-uploads/
├── profiles/          # 프로필 이미지
├── documents/         # 서류
└── temp/              # 임시 파일
```

---

## 환경 변수 관리

환경 변수는 다음과 같이 관리됩니다:

### Frontend 환경 변수

**Zod 스키마로 검증** (`packages/config/env/validate.ts`)

```typescript
export const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_VERCEL_ENV: z.enum(['development', 'preview', 'production']),
  // ...
})
```

**사용 방법**:

```typescript
import { env } from '@morton/config/env'

const apiUrl = env.NEXT_PUBLIC_API_URL
```

**주의사항**:

- `NEXT_PUBLIC_*` 접두사: 클라이언트에 노출됨
- 접두사 없음: 서버 전용

### Backend 환경 변수

**application.yml**:

```yaml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:development}
  datasource:
    url: ${DATABASE_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

jwt:
  secret: ${JWT_SECRET}
  expiration: ${JWT_EXPIRATION:3600000}
```

### 환경 변수 추가 시

환경 변수 관리: 각 앱의 `.env.example` + `scripts/link-env.sh` (워크트리 자동 심링크).

**간단 가이드**:

1. Zod 스키마 추가 (`packages/config/env/validate.ts`)
2. `.env.example` 업데이트
3. Vercel/Railway 대시보드에 변수 추가
4. (선택) Terraform 리소스 추가 (`infra/`)

---

## 배포 모니터링

### Vercel Analytics

- 페이지 로드 시간
- Core Web Vitals
- 방문자 통계

**접근 방법**: Vercel Dashboard → Analytics

### Railway Logs

- 애플리케이션 로그
- 빌드 로그
- 에러 추적

**접근 방법**: Railway Dashboard → Deployments → Logs

### 헬스체크

**Frontend**:

```bash
curl https://bconnect.to/_health
```

**Backend**:

```bash
curl https://api.bconnect.to/actuator/health
```

**예상 응답**:

```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "diskSpace": { "status": "UP" }
  }
}
```

---

## 롤백

### Frontend 롤백 (Vercel)

**방법 1: Vercel Dashboard**

1. Vercel Dashboard → Deployments
2. 이전 배포 선택
3. "Promote to Production" 클릭

**방법 2: Git Revert**

```bash
# 1. 문제 커밋 확인
git log --oneline

# 2. Revert 커밋 생성
git revert <commit-hash>

# 3. main 브랜치에 푸시
git push origin main
```

### Backend 롤백 (Railway)

**Railway Dashboard**:

1. Railway → Deployments
2. 이전 배포 선택
3. "Redeploy" 클릭

**Git Revert**: Frontend와 동일

---

## 배포 체크리스트

배포 전 다음 항목을 확인합니다:

### 배포 전

- [ ] PR QA 완료 및 승인
- [ ] 빌드 에러 없음 (`pnpm build` 성공)
- [ ] 린트 에러 없음 (`pnpm lint` 성공)
- [ ] 환경 변수 누락 확인
- [ ] 데이터베이스 마이그레이션 필요 시 사전 실행
- [ ] (Critical) 사용자 공지 (다운타임 발생 시)

### 배포 후

- [ ] 헬스체크 통과 확인
- [ ] 프로덕션 URL 접속 확인
- [ ] 주요 기능 스모크 테스트
  - 로그인/로그아웃
  - 데이터 조회
  - 데이터 생성
- [ ] 에러 로그 모니터링 (첫 10분)
- [ ] 성능 모니터링 (Vercel Analytics)

### 문제 발생 시

1. **즉시 롤백** (위 롤백 섹션 참조)
2. 문제 분석 (로그 확인)
3. 핫픽스 브랜치 생성
4. 수정 후 긴급 배포

---

## 자주 묻는 질문

### Q. PR 프리뷰가 실제 API를 호출하나요?

A. 설정에 따라 다릅니다:

- Mock API 사용: 브라우저에서 MSW로 인터셉트
- 실제 API 사용: dev/staging API 서버 호출

### Q. 배포 시간은 얼마나 걸리나요?

A. 평균 배포 시간:

- Frontend (Vercel): 1-2분
- Backend (Railway): 3-5분

### Q. 배포 실패 시 어떻게 하나요?

A. Vercel/Railway 빌드 로그 확인:

1. GitHub PR 댓글의 "Details" 클릭
2. 에러 메시지 확인
3. 로컬에서 재현 (`pnpm build`)
4. 수정 후 재푸시

### Q. 환경 변수 변경 후 배포가 필요한가요?

A. 플랫폼에 따라 다름:

- **Vercel**: 환경 변수 변경 후 Redeploy 필요
- **Railway**: 자동 재시작

### Q. 데이터베이스 마이그레이션은 어떻게 하나요?

A. Spring Boot Flyway/Liquibase 사용:

1. 마이그레이션 스크립트 작성 (`db/migration/`)
2. main 브랜치 머지
3. Railway 배포 시 자동 실행

---

## 보안

### HTTPS

모든 환경에서 HTTPS를 강제합니다:

- Vercel: 자동 SSL 인증서 (Let's Encrypt)
- Railway: 자동 SSL
- 커스텀 도메인: Vercel/Railway에서 자동 관리

### 환경 변수 보안

- ❌ `.env` 파일 커밋 금지 (`.gitignore`에 포함)
- ✅ Vercel/Railway 대시보드에서만 관리
- ✅ CI/CD에서 암호화된 시크릿 사용

### API 키 관리

민감한 키는 환경 변수로만 관리:

- AWS Access Key
- JWT Secret
- Database Password
- 외부 API 키

---

## 다음 단계

- **개발 워크플로우**: [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)
- **Git 워크플로우**: [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)
- **QA 및 테스팅**: [QA_AND_TESTING.md](./QA_AND_TESTING.md)
