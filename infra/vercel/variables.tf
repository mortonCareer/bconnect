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

# 국세청 사업자등록정보 API (data.go.kr)
variable "nts_api_service_key" {
  description = "국세청 사업자등록정보 API 서비스키 (data.go.kr)"
  type        = string
  sensitive   = true
}

# 근로복지공단 고용/산재보험 API (data.go.kr)
variable "kcomwel_api_service_key" {
  description = "근로복지공단 고용/산재보험 API 서비스키 (data.go.kr)"
  type        = string
  sensitive   = true
}
