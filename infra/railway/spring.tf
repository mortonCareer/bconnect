resource "railway_service" "api" {
  name       = "api"
  project_id = railway_project.morton.id

  source_repo        = var.github_repo
  source_repo_branch = var.github_branch
  root_directory     = "apps/api"

  regions = [{
    region       = var.railway_region
    num_replicas = 1
  }]
}

# Database connection
resource "railway_variable" "api_database_url" {
  name           = "DATABASE_URL"
  value          = "jdbc:postgresql://$${{${railway_service.postgres.name}.RAILWAY_PRIVATE_DOMAIN}}:5432/${var.db_name}"
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id
}

resource "railway_variable" "api_database_username" {
  name           = "DATABASE_USERNAME"
  value          = var.db_user
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_database_url]
}

resource "railway_variable" "api_database_password" {
  name           = "DATABASE_PASSWORD"
  value          = var.db_password
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_database_username]
}

resource "railway_variable" "api_spring_profiles" {
  name           = "SPRING_PROFILES_ACTIVE"
  value          = var.spring_profile
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_database_password]
}

# JWT
resource "railway_variable" "api_jwt_secret" {
  name           = "JWT_SECRET"
  value          = var.jwt_secret
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_spring_profiles]
}

# AWS S3 - Secrets passed as variables
resource "railway_variable" "api_aws_access_key" {
  name           = "AWS_ACCESS_KEY_ID"
  value          = var.aws_access_key_id
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_jwt_secret]
}

resource "railway_variable" "api_aws_secret_key" {
  name           = "AWS_SECRET_ACCESS_KEY"
  value          = var.aws_secret_access_key
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_aws_access_key]
}

resource "railway_variable" "api_aws_region" {
  name           = "AWS_REGION"
  value          = var.aws_region
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_aws_secret_key]
}

resource "railway_variable" "api_s3_bucket" {
  name           = "AWS_S3_BUCKET"
  value          = var.s3_bucket_name
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_aws_region]
}

# Solapi (SMS)
resource "railway_variable" "api_solapi_api_key" {
  name           = "SOLAPI_API_KEY"
  value          = var.solapi_api_key
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_s3_bucket]
}

resource "railway_variable" "api_solapi_api_secret" {
  name           = "SOLAPI_API_SECRET"
  value          = var.solapi_api_secret
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_solapi_api_key]
}

resource "railway_variable" "api_solapi_sender_number" {
  name           = "SOLAPI_SENDER_NUMBER"
  value          = var.solapi_sender_number
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_solapi_api_secret]
}

# Railpack JDK version
resource "railway_variable" "api_jdk_version" {
  name           = "RAILPACK_JDK_VERSION"
  value          = "21"
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_solapi_sender_number]
}

# JDK 17 + Railway 컨테이너 cgroup v2 호환성 문제 대응
resource "railway_variable" "api_java_tool_options" {
  name           = "JAVA_TOOL_OPTIONS"
  value          = "-XX:-UseContainerSupport"
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_jdk_version]
}

# Sentry
# NOTE: depends_on 체이닝은 Railway API rate limit 회피를 위해 의도적으로 설정
resource "railway_variable" "api_sentry_dsn" {
  name           = "SENTRY_DSN"
  value          = var.sentry_dsn
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_java_tool_options]
}

# SNS 웹 푸시 — 플랫폼 애플리케이션 ARN (region 은 AWS_REGION 재사용)
resource "railway_variable" "api_sns_platform_application_arn" {
  name           = "AWS_SNS_PLATFORM_APPLICATION_ARN"
  value          = var.sns_platform_application_arn
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_sentry_dsn]
}

resource "railway_variable" "api_cloudfront_private_key" {
  name           = "CLOUDFRONT_PRIVATE_KEY"
  value          = var.cloudfront_private_key
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_sns_platform_application_arn]
}

resource "railway_variable" "api_cloudfront_key_pair_id" {
  name           = "CLOUDFRONT_KEY_PAIR_ID"
  value          = var.cloudfront_key_pair_id
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_cloudfront_private_key]
}

# BE 가 조립하는 절대 URL 도메인 · 서명 쿠키 도메인
resource "railway_variable" "api_cloudfront_domain" {
  name           = "CLOUDFRONT_DOMAIN"
  value          = "static.${var.domain}"
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_cloudfront_key_pair_id]
}

resource "railway_variable" "api_cloudfront_cookie_domain" {
  name           = "CLOUDFRONT_COOKIE_DOMAIN"
  value          = ".${var.domain}"
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_cloudfront_domain]
}

# apex(bconnect.to)는 allowed-origin-patterns 의 *.bconnect.to 에 걸리지 않아 명시 주입
resource "railway_variable" "api_cors_allowed_origin" {
  name           = "CORS_ALLOWED_ORIGIN"
  value          = "https://${var.domain}"
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_cloudfront_cookie_domain]
}

resource "railway_variable" "api_cookie_domain" {
  name           = "COOKIE_DOMAIN"
  value          = ".${var.domain}"
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_cors_allowed_origin]
}

# 공공데이터포털 서비스키 — 디코딩 키로 주입 (UriBuilder 이중 인코딩 방지)
resource "railway_variable" "api_data_go_service_key" {
  name           = "DATA_GO_SERVICE_KEY"
  value          = var.data_go_service_key
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_cookie_domain]
}

# ===========================================================================
# Custom Domain for API
# ===========================================================================
resource "railway_custom_domain" "api" {
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id
  domain         = "api.${var.domain}"
}
