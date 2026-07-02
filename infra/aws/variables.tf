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

variable "domain" {
  description = "Root domain (e.g. bconnect.to). CloudFront static CDN 은 static.<domain> 서빙"
  type        = string
}
