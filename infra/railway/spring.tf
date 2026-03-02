resource "railway_service" "api" {
  name       = "api"
  project_id = railway_project.morton.id

  source_repo        = var.github_repo
  source_repo_branch = var.github_branch
  root_directory     = "apps/api"
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

# AWS SNS (SMS)
resource "railway_variable" "api_sns_enabled" {
  name           = "AWS_SNS_ENABLED"
  value          = "true"
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_s3_bucket]
}

# Railpack JDK version
resource "railway_variable" "api_jdk_version" {
  name           = "RAILPACK_JDK_VERSION"
  value          = "21"
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_sns_enabled]
}

# JDK 17 + Railway 컨테이너 cgroup v2 호환성 문제 대응
resource "railway_variable" "api_java_tool_options" {
  name           = "JAVA_TOOL_OPTIONS"
  value          = "-XX:-UseContainerSupport"
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.api_jdk_version]
}

# ===========================================================================
# Custom Domain for API
# ===========================================================================
resource "railway_custom_domain" "api" {
  service_id     = railway_service.api.id
  environment_id = railway_project.morton.default_environment.id
  domain         = "api.${var.domain}"
}
