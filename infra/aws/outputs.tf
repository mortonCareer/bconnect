output "app_bucket_name" {
  description = "The name of the application S3 bucket"
  value       = aws_s3_bucket.app_storage.id
}

output "app_bucket_arn" {
  description = "The ARN of the application S3 bucket"
  value       = aws_s3_bucket.app_storage.arn
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

output "kiscon_sync_access_key_id" {
  description = "Access key ID for KISCON sync IAM user"
  value       = aws_iam_access_key.kiscon_sync_key.id
  sensitive   = true
}

output "kiscon_sync_secret_access_key" {
  description = "Secret access key for KISCON sync IAM user"
  value       = aws_iam_access_key.kiscon_sync_key.secret
  sensitive   = true
}
