# =============================================================================
# dev(staging) environment variables — 완전 SSOT
# =============================================================================
# Railway GUI prod 복제로 dev 환경에 모든 변수가 이미 존재하므로 전부 import 한다.
# (import 명령은 scripts/import-dev.sh 참조 — service_id:dev:<NAME> 포맷)
#
# prod(spring.tf/database.tf)와 값이 다른 delta:
#   DATABASE_PASSWORD / POSTGRES_PASSWORD = dev_db_password (prod 와 분리)
#   JWT_SECRET                            = dev_jwt_secret  (prod 와 분리)
#   AWS_S3_BUCKET                         = dev_s3_bucket_name
#   SENTRY_ENVIRONMENT                    = "dev"
# 나머지는 prod 와 동일 값을 공유한다.
#
# SPRING_PROFILES_ACTIVE 는 prod 프로파일 유지 — datasource(url/user/pw) 와이어링이
# application-prod.yaml 에만 있고 base application.yaml 엔 없어, dev/staging 프로파일
# 부재 시 base fallback → datasource 미설정 → 부팅 실패. 전용 application-dev.yaml 은
# BE 후속(#353 묶거나 신규 이슈).
#
# RAILWAY_*, PG*, DATABASE_PUBLIC_URL 등은 Railway 가 자동 주입하는 변수라 TF 비관리.
#
# NOTE: depends_on 체이닝은 prod(spring.tf)와 동일하게 Railway API rate limit 회피용.

# --- API service --------------------------------------------------------------
resource "railway_variable" "dev_api_database_url" {
  name           = "DATABASE_URL"
  value          = "jdbc:postgresql://$${{${railway_service.postgres.name}.RAILWAY_PRIVATE_DOMAIN}}:5432/${var.db_name}"
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id
}

resource "railway_variable" "dev_api_database_username" {
  name           = "DATABASE_USERNAME"
  value          = var.db_user
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_database_url]
}

# DATABASE_PASSWORD(api) 와 POSTGRES_PASSWORD(postgres) 는 동일 값이어야 함 — dev 전용 시크릿
resource "railway_variable" "dev_api_database_password" {
  name           = "DATABASE_PASSWORD"
  value          = var.dev_db_password
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_database_username]
}

resource "railway_variable" "dev_api_spring_profiles" {
  name           = "SPRING_PROFILES_ACTIVE"
  value          = var.spring_profile
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_database_password]
}

resource "railway_variable" "dev_api_jwt_secret" {
  name           = "JWT_SECRET"
  value          = var.dev_jwt_secret
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_spring_profiles]
}

resource "railway_variable" "dev_api_aws_access_key" {
  name           = "AWS_ACCESS_KEY_ID"
  value          = var.aws_access_key_id
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_jwt_secret]
}

resource "railway_variable" "dev_api_aws_secret_key" {
  name           = "AWS_SECRET_ACCESS_KEY"
  value          = var.aws_secret_access_key
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_aws_access_key]
}

resource "railway_variable" "dev_api_aws_region" {
  name           = "AWS_REGION"
  value          = var.aws_region
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_aws_secret_key]
}

resource "railway_variable" "dev_api_s3_bucket" {
  name           = "AWS_S3_BUCKET"
  value          = var.dev_s3_bucket_name
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_aws_region]
}

resource "railway_variable" "dev_api_solapi_api_key" {
  name           = "SOLAPI_API_KEY"
  value          = var.solapi_api_key
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_s3_bucket]
}

resource "railway_variable" "dev_api_solapi_api_secret" {
  name           = "SOLAPI_API_SECRET"
  value          = var.solapi_api_secret
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_solapi_api_key]
}

resource "railway_variable" "dev_api_solapi_sender_number" {
  name           = "SOLAPI_SENDER_NUMBER"
  value          = var.solapi_sender_number
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_solapi_api_secret]
}

resource "railway_variable" "dev_api_jdk_version" {
  name           = "RAILPACK_JDK_VERSION"
  value          = "21"
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_solapi_sender_number]
}

resource "railway_variable" "dev_api_java_tool_options" {
  name           = "JAVA_TOOL_OPTIONS"
  value          = "-XX:-UseContainerSupport"
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_jdk_version]
}

resource "railway_variable" "dev_api_sentry_dsn" {
  name           = "SENTRY_DSN"
  value          = var.sentry_dsn
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_java_tool_options]
}

resource "railway_variable" "dev_api_sentry_environment" {
  name           = "SENTRY_ENVIRONMENT"
  value          = "dev"
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api_sentry_dsn]
}

# --- Postgres service ---------------------------------------------------------
resource "railway_variable" "dev_postgres_user" {
  name           = "POSTGRES_USER"
  value          = var.db_user
  service_id     = railway_service.postgres.id
  environment_id = railway_environment.dev.id
}

# 주의: POSTGRES_PASSWORD 는 postgres 가 빈 데이터 디렉토리로 첫 init 할 때만 실제 DB
# 비밀번호로 반영된다. 클론된 dev postgres 는 prod 비밀번호로 이미 init 된 volume 을
# 가지므로, dev 전용 비밀번호 적용은 volume 재초기화가 필요(dev 는 데이터 없어 안전).
resource "railway_variable" "dev_postgres_password" {
  name           = "POSTGRES_PASSWORD"
  value          = var.dev_db_password
  service_id     = railway_service.postgres.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_postgres_user]
}

resource "railway_variable" "dev_postgres_db" {
  name           = "POSTGRES_DB"
  value          = var.db_name
  service_id     = railway_service.postgres.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_postgres_password]
}

# =============================================================================
# dev 외부 접근 — Railway 생성 도메인(api) + TCP proxy(postgres)
# =============================================================================
# api 도메인: dev/api 에 service domain 부재 → 신규 생성.
#   subdomain 은 Railway 전역 유일해야 하므로 apply 시 충돌하면 조정.
resource "railway_service_domain" "api_dev" {
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id
  subdomain      = "morton-api-dev"
}

# postgres TCP proxy: 클론이 이미 생성(id 28dcbe10-...) → import.
#   terraform import 'module.railway.railway_tcp_proxy.postgres_dev' 28dcbe10-599f-4a9e-b842-4e68cf4b0543
resource "railway_tcp_proxy" "postgres_dev" {
  service_id       = railway_service.postgres.id
  environment_id   = railway_environment.dev.id
  application_port = 5432
}
