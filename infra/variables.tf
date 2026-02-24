# =============================================================================
# Railway & GitHub
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

variable "github_repo" {
  description = "GitHub repository URL for Railway (e.g., github.com/username/repo)"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch for Railway deployment"
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

# =============================================================================
# Spring App Config
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

# =============================================================================
# AWS Config (for App & Terraform Backend)
# =============================================================================

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for application file storage"
  type        = string
}

# =============================================================================
# Domain Config
# =============================================================================

variable "domain" {
  description = "Root domain for the project (e.g., bconnect.to)"
  type        = string
}

# =============================================================================
# Vercel
# =============================================================================

variable "vercel_api_token" {
  description = "Vercel API Token"
  type        = string
  sensitive   = true
}

# =============================================================================
# External API Keys
# =============================================================================

variable "nts_api_service_key" {
  description = "국세청 사업자등록정보 API 서비스키 (data.go.kr)"
  type        = string
  sensitive   = true
}
