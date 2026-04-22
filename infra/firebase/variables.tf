variable "project_id" {
  description = "GCP 프로젝트 ID (전역 고유, 6-30자, 소문자/숫자/하이픈)"
  type        = string
  default     = "bconnect-f0bee"
}

variable "project_name" {
  description = "GCP 프로젝트 표시 이름"
  type        = string
  default     = "bconnect"
}

variable "region" {
  description = "GCP 리전"
  type        = string
  default     = "asia-northeast3" # 서울
}

variable "billing_account_id" {
  description = "결제 계정 ID (Spark 플랜이면 null). 예: 01B4BF-2106F6-A0362D"
  type        = string
  default     = null
  sensitive   = true
}