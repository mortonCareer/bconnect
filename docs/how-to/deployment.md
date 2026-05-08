# 배포

배포 환경 및 프로세스

---

## 배포 환경

bconnect은 **2단계 배포 모델**을 사용합니다:

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
- **URL 예시**: `https://<vercel-project>-git-<branch>-<team>.vercel.app` (각 PR Vercel comment에 자동 노출)

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

---

## 인프라 구성

도구 식별자(프로젝트명/bucket/services 등)는 [tools.md](../reference/tools.md) 또는 각 Terraform 모듈 참조. 본 섹션은 **운영 관점**만 다룸.

### Vercel ([infra/vercel/](../../infra/vercel/))

- 자동 빌드/배포, PR 프리뷰, CDN/Edge, Analytics
- **환경 변수 설정**: Vercel Dashboard → Project Settings → Environment Variables (또는 Terraform `vercel_project_environment_variable`)

### Railway ([infra/railway/](../../infra/railway/))

- Docker 기반 배포, 자동 헬스체크, 로그 모니터링
- PostgreSQL 호스팅 포함

### AWS ([infra/aws/](../../infra/aws/))

- **S3**: 사용자 업로드 파일 (`profiles/`, `documents/`, `temp/`, `kiscon/`)
- **CloudFront**: S3 앞단 CDN + signed cookie (private content)
- **(향후) Lambda@Edge**: 이미지 리사이즈
- **(향후) RDS**: Railway 대체 검토

자세한 파일 인프라 설계: [docs/reference/specs/2026-04-12-file-infrastructure-design.md](../reference/specs/2026-04-12-file-infrastructure-design.md)

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
import { env } from '@bconnect/config/env'

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
