# Railway Infrastructure

Morton 백엔드 인프라를 Terraform으로 관리합니다.

## 구성요소

| 서비스     | 설명               |
| ---------- | ------------------ |
| PostgreSQL | 메인 데이터베이스  |
| API        | Spring Boot 백엔드 |

환경: `prod` + `dev`(`dev` 브랜치 추적, staging 역할). 설계 배경은
[2026-05-15-railway-staging-environment-design.md](../../docs/reference/specs/2026-05-15-railway-staging-environment-design.md) 참조.

## dev 환경 — GUI 수동 단계 (TF 시야 밖)

community provider 제약상 아래는 Railway GUI 1회 수동 (postgres volume 과 동일 패턴):

1. **환경 생성**: prod 환경을 GUI 에서 `dev` 로 복제 → 복제된 환경/변수/TCP proxy 를 `terraform import` 로 1회 흡수 (provider 가 빈 환경에 서비스를 fork 하지 않아 GUI 복제가 필요)
2. **source branch override**: `dev` 환경 → `api` 서비스 → source branch 를 `dev` 로 override (TF state 밖)
3. **postgres volume**: `dev` 환경 postgres volume (복제 시 자동 생성, prod 패턴 동일)
4. **(dev 전용 DB 비밀번호 적용 시)** postgres 는 빈 데이터 디렉토리 첫 init 때만 `POSTGRES_PASSWORD` 반영 → 클론 직후 volume 재초기화 필요 (dev 는 데이터 없어 안전)

## 볼륨 백업 (TF 밖)

Railway Pro 볼륨 백업(스냅샷). community provider 가 미지원(리소스 9종에 backup 없음,
`volume.size` 도 read-only)이고, 배포마다 안 바뀌는 set-once 설정이라 IaC 밖에서
관리한다(Railway Service → Backups).

**정책**: prod 볼륨만 `DAILY`(6일 보관) + `WEEKLY`(1개월 보관). dev 는 테스트 데이터라
제외. 과금은 볼륨과 동일 CoW 증분($0.15/GB/월, 고유 델타만) — prod ~0.25GB 기준 월 $0.1
미만. 복원/PITR 도 Railway Backups 패널.

### 볼륨 크기 조정 (TF 밖)

`volume.size` 는 provider read-only → 리사이즈는 GUI live-resize(확장만, 축소 불가).
Pro 최대 50GB. prod 볼륨이 50% 이상 차면 확장 필요.

## 계정 사용량 한도 (account-level, TF 밖)

지출 폭주 방지 워크스페이스 한도: **soft $80**(초과 시 이메일 경고) / **hard $100**
(초과 시 워크로드 일시중단). 계정(billing customer) 단위라 프로젝트 IaC(SSOT) 밖.

## 사전 요구사항

1. [Terraform](https://www.terraform.io/downloads) >= 1.0
2. Railway 계정 및 API Token
3. GitHub repository

## Railway API Token 발급

1. [Railway Dashboard](https://railway.app) 접속
2. Account Settings → Tokens
3. "Create Token" 클릭
4. 토큰 복사

## 사용 방법

```bash
# 1. 변수 파일 생성
cp terraform.tfvars.example terraform.tfvars

# 2. terraform.tfvars 수정 (실제 값 입력)
vim terraform.tfvars

# 3. 초기화
terraform init

# 4. 계획 확인
terraform plan

# 5. 적용
terraform apply
```

## 커스텀 도메인 설정

`terraform apply` 후 Railway에서 제공하는 CNAME 값을 DNS에 등록해야 합니다.

```
api.morton.com → CNAME → <railway-provided-value>
```

## 환경변수

API 서비스에 설정되는 환경변수:

| 변수                   | 설명                   |
| ---------------------- | ---------------------- |
| DATABASE_URL           | PostgreSQL 연결 URL    |
| SPRING_PROFILES_ACTIVE | Spring 프로파일        |
| JWT_SECRET             | JWT 서명 키            |
| AWS_ACCESS_KEY_ID      | S3/SNS용               |
| AWS_SECRET_ACCESS_KEY  | S3/SNS용               |
| AWS_REGION             | AWS 리전               |
| S3_BUCKET_NAME         | 포트폴리오 이미지 버킷 |

## 주의사항

- `terraform.tfvars`는 **절대 커밋하지 마세요**
- 민감한 값은 Railway Dashboard에서 직접 수정 가능
