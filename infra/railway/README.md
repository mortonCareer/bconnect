# Railway Infrastructure

Morton 백엔드 인프라를 Terraform으로 관리합니다.

## 구성요소

| 서비스     | 설명               |
| ---------- | ------------------ |
| PostgreSQL | 메인 데이터베이스  |
| API        | Spring Boot 백엔드 |

환경: `production`(prod) + `dev`(staging, `dev` 브랜치 추적). 설계 배경은
[2026-05-15-railway-staging-environment-design.md](../../docs/reference/specs/2026-05-15-railway-staging-environment-design.md) 참조.

## dev 환경 — GUI 수동 단계 (TF 시야 밖)

community provider 제약상 아래는 Railway GUI 1회 수동 (postgres volume 과 동일 패턴):

1. **환경 생성**: prod 환경을 GUI 에서 `dev` 로 복제 → 이후 `scripts/import-dev.sh` 로 TF state 흡수
2. **source branch override**: `dev` 환경 → `api` 서비스 → source branch 를 `dev` 로 override (TF state 밖)
3. **postgres volume**: `dev` 환경 postgres volume (복제 시 자동 생성, prod 패턴 동일)
4. **(dev 전용 DB 비밀번호 적용 시)** postgres 는 빈 데이터 디렉토리 첫 init 때만 `POSTGRES_PASSWORD` 반영 → 클론 직후 volume 재초기화 필요 (dev 는 데이터 없어 안전)

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
