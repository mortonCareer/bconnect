output "app_bucket_name" {
  description = "The name of the application S3 bucket"
  value       = aws_s3_bucket.app_storage.id
}

output "app_bucket_arn" {
  description = "The ARN of the application S3 bucket"
  value       = aws_s3_bucket.app_storage.arn
}

output "dev_app_bucket_name" {
  description = "The name of the dev(staging) application S3 bucket"
  value       = aws_s3_bucket.app_storage_dev.id
}

output "dev_app_bucket_arn" {
  description = "The ARN of the dev(staging) application S3 bucket"
  value       = aws_s3_bucket.app_storage_dev.arn
}

output "sns_platform_application_arn" {
  description = "SNS FCM 플랫폼 애플리케이션 ARN (credential 미설정 시 빈 문자열)"
  value       = try(aws_sns_platform_application.fcm[0].arn, "")
}

output "access_key_id" {
  description = "The access key ID for the application IAM user"
  value       = aws_iam_access_key.app_key.id
  sensitive   = true
}

output "secret_access_key" {
  description = "The secret access key for the application IAM user"
  value       = aws_iam_access_key.app_key.secret
  sensitive   = true
}
