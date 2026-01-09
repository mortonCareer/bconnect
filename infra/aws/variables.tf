variable "s3_bucket_name" {
  description = "Name of the S3 bucket for application storage"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}
