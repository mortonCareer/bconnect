variable "vercel_api_token" {
  description = "Vercel API 토큰"
  type        = string
  sensitive   = true
}

variable "domain" {
  description = "Root domain for the project (e.g., bconnect.to)"
  type        = string
}

variable "dev_api_url" {
  description = "Railway staging BE base URL — dev custom environment 에서 호출 (#352, ADR-0010)"
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

# Sentry 소스맵 업로드 (DSN·org·project는 코드에 하드코딩)
variable "sentry_auth_token" {
  description = "Sentry auth token - 소스맵 업로드"
  type        = string
  sensitive   = true
  default     = ""
}

# Slack Incoming Webhook URL (크롤링 스키마 변경 알림)
variable "slack_webhook_url" {
  description = "Slack Incoming Webhook URL - 크롤링 스키마 변경 알림용"
  type        = string
  sensitive   = true
  default     = ""
}

# Railway Postgres (외부 접속용 TCP proxy URL)
variable "database_url" {
  description = "Railway Postgres DATABASE_URL (TCP proxy)"
  type        = string
  sensitive   = true
}

# Firebase (Cloud Messaging) Web SDK configs — 앱별 map
#   key: "career" | "plan"
variable "firebase_web_configs" {
  description = "Firebase 웹 앱 SDK config 맵 (key: 프론트엔드 앱 이름)"
  type = map(object({
    api_key             = string
    auth_domain         = string
    project_id          = string
    storage_bucket      = string
    messaging_sender_id = string
    app_id              = string
  }))
  sensitive = true
}

variable "firebase_vapid_key" {
  description = "Firebase Web Push VAPID public key (Firebase Console에서 수동 생성)"
  type        = string
  sensitive   = true
  default     = ""
}
