variable "vercel_api_token" {
  description = "Vercel API 토큰"
  type        = string
  sensitive   = true
}

variable "domain" {
  description = "Root domain for the project (e.g., bconnect.to)"
  type        = string
}

variable "project_name" {
  description = "Project name (used for Vercel project name prefix)"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository (owner/repo)"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch to deploy"
  type        = string
  default     = "main"
}

# AWS credentials for Lambda invocation
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
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}
