# Railway 인프라

> 대상: 인프라 개발자<br>
> 학습 목표: Railway 프로젝트 구성과 환경별 수동 단계를 확인한다<br>
> 위치: `infra/railway`

## 구성요소

| 서비스     | 설명               |
| ---------- | ------------------ |
| PostgreSQL | 메인 데이터베이스  |
| API        | Spring Boot 백엔드 |

환경은 prod 와 dev 입니다.

## dev 환경 · GUI 수동 단계

community provider 제약상 아래는 Railway GUI 에서 1회 수동 처리합니다. TF 시야 밖이고 postgres volume 과 동일 패턴입니다.

1. 환경 생성. prod 환경을 GUI 에서 `dev` 로 복제
   - 복제된 환경·변수·TCP proxy 를 `terraform import` 로 1회 흡수
   - provider 가 빈 환경에 서비스를 fork 하지 않아 GUI 복제가 필요
2. source branch override. `dev` 환경 → `api` 서비스 → source branch 를 `dev` 로 override
   - TF state 밖
3. postgres volume. `dev` 환경 postgres volume
   - 복제 시 자동 생성. prod 패턴과 동일
4. dev 전용 DB 비밀번호 적용 시 volume 재초기화 필요
   - postgres 는 빈 데이터 디렉토리 첫 init 때만 `POSTGRES_PASSWORD` 반영
   - 클론 직후 재초기화. dev 는 데이터 없어 안전

## 사전 요구사항

1. [Terraform : Downloads](https://www.terraform.io/downloads) 1.0 이상
2. Railway 계정 및 API Token
3. GitHub repository

## Railway API Token 발급

1. [Railway 대시보드](https://railway.app) 접속
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

```text
api.morton.com → CNAME → <railway-provided-value>
```

## 환경변수

API 서비스에 설정되는 환경변수입니다.

| 변수                         | 설명                        |
| ---------------------------- | --------------------------- |
| DATABASE_URL                 | PostgreSQL 연결 URL         |
| DATABASE_USERNAME            | PostgreSQL 사용자           |
| DATABASE_PASSWORD            | PostgreSQL 비밀번호         |
| SPRING_PROFILES_ACTIVE       | Spring 프로파일             |
| JWT_SECRET                   | JWT 서명 키                 |
| COOKIE_DOMAIN                | JWT 쿠키 도메인             |
| CORS_ALLOWED_ORIGIN          | CORS 허용 origin 목록       |
| CORS_ALLOWED_ORIGIN_PATTERNS | CORS 허용 origin 패턴       |
| AWS_ACCESS_KEY_ID            | S3/SNS용                    |
| AWS_SECRET_ACCESS_KEY        | S3/SNS용                    |
| AWS_REGION                   | AWS 리전                    |
| AWS_S3_BUCKET                | 첨부 파일 버킷              |
| AWS_SNS_PLATFORM_ARN         | 웹 푸시 플랫폼 애플리케이션 |
| CLOUDFRONT_DOMAIN            | 정적 파일 CDN 도메인        |
| CLOUDFRONT_KEY_PAIR_ID       | 서명 쿠키 공개키 ID         |
| CLOUDFRONT_PRIVATE_KEY       | 서명 쿠키 개인키 base64     |
| CLOUDFRONT_COOKIE_DOMAIN     | 서명 쿠키 도메인            |
| DATA_GO_SERVICE_KEY          | 공공데이터포털 서비스키     |
| SOLAPI_API_KEY               | SMS 발송                    |
| SOLAPI_API_SECRET            | SMS 발송                    |
| SOLAPI_SENDER_NUMBER         | SMS 발신번호                |
| SENTRY_DSN                   | 에러 트래킹                 |
| SENTRY_ENVIRONMENT           | 에러 트래킹 환경 구분       |
| RAILPACK_JDK_VERSION         | 빌드 JDK 버전               |
| JAVA_TOOL_OPTIONS            | 컨테이너 cgroup v2 호환     |

## 주의사항

- `terraform.tfvars`는 절대 커밋하지 마세요
- 민감한 값은 Railway Dashboard에서 직접 수정 가능
