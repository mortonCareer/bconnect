variable "s3_bucket_name" {
  description = "Name of the S3 bucket for application storage"
  type        = string
}

variable "dev_s3_bucket_name" {
  description = "Name of the S3 bucket for dev(staging) environment storage"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "fcm_service_account_json" {
  description = "FCM(HTTP v1) 서비스 계정 키 JSON — SNS GCM 플랫폼 애플리케이션 credential. 비어 있으면(초기 세팅 전) 플랫폼 앱 생성 생략."
  type        = string
  sensitive   = true
  default     = ""
}
