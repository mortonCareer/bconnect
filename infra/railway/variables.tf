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

# =============================================================================
# Domain
# =============================================================================

variable "domain" {
  description = "Root domain for the project (e.g., bconnect.to)"
  type        = string
}
