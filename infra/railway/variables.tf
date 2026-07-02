# =============================================================================
# Railway
# =============================================================================

variable "railway_token" {
  description = "Railway API token"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Railway project name"
  type        = string
  default     = "morton"
}

# =============================================================================
# GitHub
# =============================================================================

variable "github_repo" {
  description = "GitHub repository URL (e.g., github.com/username/repo)"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch to deploy"
  type        = string
  default     = "main"
}

# =============================================================================
# Database
# =============================================================================

variable "db_user" {
  description = "PostgreSQL username"
  type        = string
  default     = "morton"
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "morton"
}

variable "dev_db_password" {
  description = "PostgreSQL password for dev(staging) environment (prod 와 분리된 시크릿)"
  type        = string
  sensitive   = true
}

# =============================================================================
# Spring
# =============================================================================

variable "spring_profile" {
  description = "Spring active profile"
  type        = string
  default     = "prod"
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "dev_jwt_secret" {
  description = "JWT signing secret for dev(staging) environment (prod 와 분리된 시크릿)"
  type        = string
  sensitive   = true
}

# =============================================================================
# AWS
# =============================================================================

variable "aws_access_key_id" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for file storage"
  type        = string
}

variable "dev_s3_bucket_name" {
  description = "S3 bucket name for dev(staging) environment file storage"
  type        = string
}

# =============================================================================
# Sentry
# =============================================================================

variable "sentry_dsn" {
  description = "Sentry DSN for API error tracking"
  type        = string
  sensitive   = true
}

# =============================================================================
# Solapi (SMS)
# =============================================================================

variable "solapi_api_key" {
  description = "Solapi API Key for SMS sending"
  type        = string
  sensitive   = true
}

variable "solapi_api_secret" {
  description = "Solapi API Secret for SMS sending"
  type        = string
  sensitive   = true
}

variable "solapi_sender_number" {
  description = "Solapi registered sender phone number"
  type        = string
  sensitive   = true
}

# =============================================================================
# Domain
# =============================================================================

variable "domain" {
  description = "Root domain for the project (e.g., bconnect.to)"
  type        = string
}

# =============================================================================
# CloudFront (signed cookie)
# =============================================================================

variable "cloudfront_private_key" {
  description = "CloudFront 서명 개인키 base64 (infra/aws output cloudfront_private_key_base64)"
  type        = string
  sensitive   = true
}

variable "cloudfront_key_pair_id" {
  description = "CloudFront에 등록한 공개키의 ID (AWS 자동 발급). 서명 쿠키가 '이 공개키로 검증'을 지목하는 용도. infra/aws output cloudfront_key_pair_id"
  type        = string
}
