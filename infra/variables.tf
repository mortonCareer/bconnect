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

variable "dev_db_password" {
  description = "PostgreSQL password for dev(staging) environment (prod 와 분리된 시크릿)"
  type        = string
  sensitive   = true
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

variable "dev_jwt_secret" {
  description = "JWT signing secret for dev(staging) environment (prod 와 분리된 시크릿)"
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

variable "dev_s3_bucket_name" {
  description = "S3 bucket name for dev(staging) environment file storage"
  type        = string
  default     = "morton-storage-dev"
}

# =============================================================================
# Domain Config
# =============================================================================

variable "domain" {
  description = "Root domain for the project (e.g., bconnect.to)"
  type        = string
}

variable "dev_api_url" {
  description = "Railway staging BE base URL — dev 브랜치 Vercel 환경에서 호출 (#352, ADR-0010)"
  type        = string
  default     = "https://api.dev.bconnect.to"
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

variable "data_go_service_key" {
  description = "공공데이터포털(data.go.kr) 서비스키 — 디코딩 키. BE 원클릭 조회가 국세청·근로복지공단·KISCON·소방청에 공통 사용"
  type        = string
  sensitive   = true
}

variable "kcomwel_api_service_key" {
  description = "근로복지공단 고용/산재보험 API 서비스키 (data.go.kr)"
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

variable "slack_monitoring_webhook_url" {
  description = "Slack Incoming Webhook URL - 모니터링 전용 채널 (봇 자동 알림)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sentry_auth_token" {
  description = "Sentry auth token - 소스맵 업로드"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sentry_dsn" {
  description = "Sentry DSN - API 에러 트래킹"
  type        = string
  sensitive   = true
  default     = ""
}

# =============================================================================
# Firebase (Cloud Messaging)
# =============================================================================

variable "firebase_project_id" {
  description = "GCP/Firebase 프로젝트 ID (전역 고유)"
  type        = string
  default     = "bconnect-f0bee"
}

variable "firebase_project_name" {
  description = "Firebase 프로젝트 표시 이름"
  type        = string
  default     = "bconnect"
}

variable "firebase_billing_account_id" {
  description = "결제 계정 ID (Spark 플랜이면 null)"
  type        = string
  sensitive   = true
  default     = null
}

variable "firebase_vapid_key" {
  description = "Firebase Web Push VAPID public key (Firebase Console → Cloud Messaging에서 수동 생성)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "firebase_service_account_json" {
  description = "FCM(HTTP v1) 서비스 계정 키 JSON — SNS GCM 플랫폼 애플리케이션 credential 용. 절대 커밋 금지(gitignored tfvars/.secrets). 비어 있으면 SNS 플랫폼 앱 생성 생략."
  type        = string
  sensitive   = true
  default     = ""
}

# =============================================================================
# Database (Railway Postgres TCP Proxy)
# =============================================================================

variable "database_url" {
  description = "Railway Postgres DATABASE_URL (TCP proxy) - KISCON 건설업체정보 조회"
  type        = string
  sensitive   = true
}
