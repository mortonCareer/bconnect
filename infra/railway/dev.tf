locals {
  dev_api_variables = {
    DATABASE_URL           = "jdbc:postgresql://$${{${railway_service.postgres.name}.RAILWAY_PRIVATE_DOMAIN}}:5432/${var.db_name}"
    DATABASE_USERNAME      = var.db_user
    DATABASE_PASSWORD      = var.dev_db_password
    SPRING_PROFILES_ACTIVE = "dev"
    JWT_SECRET             = var.dev_jwt_secret
    AWS_ACCESS_KEY_ID      = var.aws_access_key_id
    AWS_SECRET_ACCESS_KEY  = var.aws_secret_access_key
    AWS_REGION             = var.aws_region
    AWS_S3_BUCKET          = var.dev_s3_bucket_name
    SOLAPI_API_KEY         = var.solapi_api_key
    SOLAPI_API_SECRET      = var.solapi_api_secret
    SOLAPI_SENDER_NUMBER   = var.solapi_sender_number
    RAILPACK_JDK_VERSION   = "21"
    JAVA_TOOL_OPTIONS      = "-XX:-UseContainerSupport"
    SENTRY_DSN             = var.sentry_dsn

    CORS_ALLOWED_ORIGIN = "https://dev.${var.domain}"
    COOKIE_DOMAIN       = ".${var.domain}"
    DATA_GO_SERVICE_KEY = var.data_go_service_key

    AWS_SNS_PLATFORM_APPLICATION_ARN = var.sns_platform_application_arn

    # dev BE 가 조립하는 절대 URL 도메인. dev 키 서명이 prod 도메인을 가리키면 검증 실패.
    CLOUDFRONT_DOMAIN        = "static-dev.${var.domain}"
    CLOUDFRONT_COOKIE_DOMAIN = ".${var.domain}"
    CLOUDFRONT_PRIVATE_KEY   = var.dev_cloudfront_private_key
    CLOUDFRONT_KEY_PAIR_ID   = var.dev_cloudfront_key_pair_id
  }

  dev_postgres_variables = {
    POSTGRES_USER     = var.db_user
    POSTGRES_PASSWORD = var.dev_db_password
    POSTGRES_DB       = var.db_name
  }
}

resource "railway_variable" "dev_api" {
  for_each       = local.dev_api_variables
  name           = each.key
  value          = each.value
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_environment.dev]
}

resource "railway_variable" "dev_postgres" {
  for_each       = local.dev_postgres_variables
  name           = each.key
  value          = each.value
  service_id     = railway_service.postgres.id
  environment_id = railway_environment.dev.id

  depends_on = [railway_variable.dev_api]
}

resource "railway_service_domain" "api_dev" {
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id
  subdomain      = "${var.project_name}-${railway_service.api.name}-${railway_environment.dev.name}"
}

resource "railway_tcp_proxy" "postgres_dev" {
  service_id       = railway_service.postgres.id
  environment_id   = railway_environment.dev.id
  application_port = 5432
}

# dev custom 도메인 (ADR-0016). railway 생성 도메인(api_dev)과 병행.
# DNS CNAME 은 가비아에서 수동 등록.
resource "railway_custom_domain" "api_dev" {
  service_id     = railway_service.api.id
  environment_id = railway_environment.dev.id
  domain         = "api.dev.${var.domain}"
}
