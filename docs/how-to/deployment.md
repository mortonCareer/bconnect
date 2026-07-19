# 배포

> **For**: 모든 개발자.
> **You'll be able to**: dev 머지 후 production 까지 배포 절차 수행, 헬스체크, 롤백.

배포 환경 및 프로세스

---

## 배포 환경

bconnect은 **2단계 배포 모델**을 사용합니다:

```
dev (개발 및 QA)  →  prod (프로덕션)
```

| 환경 | 목적          | 배포 방식         |
| ---- | ------------- | ----------------- |
| dev  | PR 프리뷰, QA | PR 생성 시 자동   |
| prod | 실제 서비스   | main 머지 시 자동 |

각 환경의 도메인 매핑(career/plan/api × prod/dev/프리뷰/로컬)은 [도메인 현황](../reference/domains.md) 참조.

### dev 환경 (PR 프리뷰)

- **목적**: 기능 개발 후 QA 수행
- **배포 트리거**: PR 생성 또는 업데이트
- **배포 플랫폼**: Vercel (Frontend), Railway (Backend)
- **데이터**: 테스트 데이터 또는 Mock API
- **URL**: 브랜치별 Vercel 프리뷰 도메인 (각 PR Vercel comment에 자동 노출) — [도메인 현황](../reference/domains.md) 참조

### prod 환경 (프로덕션)

- **목적**: 실제 사용자 대상 서비스
- **배포 트리거**: main 브랜치 머지
- **배포 플랫폼**: Vercel (Frontend), Railway (Backend)
- **데이터**: 실제 프로덕션 데이터
- **URL**: career/plan/api production 도메인 — [도메인 현황](../reference/domains.md) 참조

---

## 배포 프로세스

### Frontend (Next.js)

Vercel 배포는 git push 자동배포가 아니라 **GitHub Actions의 CLI 소스 업로드**로 트리거된다 ([`vercel-deploy.yml`](../../.github/workflows/vercel-deploy.yml)). Vercel Pro 팀은 배포에 첨부된 git 커밋 author가 팀 멤버여야 하는데(시트 과금), `.git` 제거 후 CLI 업로드하면 git 메타가 없어 멤버 승격 없이 배포된다. git push 자동배포는 `git.deploymentEnabled: false`(각 앱 vercel.json)로 꺼져 있다. 운영 상세는 [infra/vercel/README.md](../../infra/vercel/README.md) 참조.

#### dev 배포

```
dev 브랜치 머지 (push)
    ↓
GitHub Actions: vercel-deploy.yml → vercel deploy --target=dev
    ↓
Vercel 리모트 빌드 (custom environment "dev")
    ↓
dev 도메인 업데이트
    ↓
스프린트 단위 QA
```

#### 프로덕션 배포

```
dev → main 머지 (push)
    ↓
GitHub Actions: vercel-deploy.yml → vercel deploy --target=production
    ↓
Vercel 리모트 빌드
    ↓
bconnect.to / plan.bconnect.to 업데이트
    ↓
헬스체크 (자동)
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

### Android 앱 (career TWA)

career PWA를 [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)으로 Android TWA(Trusted Web Activity)로 패키징해 Play/사이드로드 배포한다. TWA는 콘텐츠를 라이브 URL에서 로드하므로 **웹 배포만으로 앱 내용이 갱신**되고, 앱 재빌드는 `twa-manifest.template.json`(이름·아이콘·host 등)이 바뀔 때만 한다.

```bash
cd apps/career/android-twa
export TWA_KEYSTORE_PASSWORD=... TWA_KEY_PASSWORD=...
./build.sh prod   # career.bconnect.to (Play/실서비스)
./build.sh dev    # career.dev.bconnect.to (사이드로드 테스트)
```

빌드 사전조건(툴체인·키스토어)·산출물·Digital Asset Links·함정은 [`apps/career/android-twa/README.md`](../../apps/career/android-twa/README.md)가 SSOT다. 도구 선택 근거는 [ADR-0023](../explanation/adr/0023-android-twa-packaging-bubblewrap.md).

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

새 환경 변수를 어디에 넣고 어떻게 fail-fast로 검증하는지(계층별 저장 위치, `.env.example` 계약, Zod/Spring placeholder)는 [env-variables.md](./env-variables.md)가 SSOT다. 본 문서는 **배포 관점**만 다룬다.

환경 변수 주입은 **Terraform(IaC)으로 관리**한다 — 대시보드 수동 조작은 IaC 위반이므로 긴급/예외 시에만.

- **Frontend(Vercel)**: [`infra/vercel/`](../../infra/vercel/)의 `vercel_project_environment_variable` 리소스로 선언. 환경별(prod/preview/dev)은 `target`으로 스코프 지정.
- **Backend(Railway)**: [`infra/railway/`](../../infra/railway/)의 `railway_variable` 리소스로 선언. 로컬은 [`application-local.yaml`](../../apps/api/src/main/resources/application-local.yaml) 더미값으로 주입 없이 뜬다.
- **주입 누락 시**: FE는 Zod 검증 실패, API는 `${VAR}` placeholder 미해결로 **부팅 실패**(fail-fast) — silent-fail 방지.

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
