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

output "cloudfront_key_pair_id" {
  description = "CloudFront에 등록한 공개키의 ID (AWS 자동 발급). 서명 쿠키가 '이 공개키로 검증'을 지목하는 용도. Railway CLOUDFRONT_KEY_PAIR_ID"
  value       = aws_cloudfront_public_key.cf_signing.id
}

output "cloudfront_private_key_base64" {
  description = "CloudFront 서명 개인키 PKCS8 PEM 을 base64 로 인코딩 (Railway CLOUDFRONT_PRIVATE_KEY)"
  value       = base64encode(tls_private_key.cf_signing.private_key_pem_pkcs8)
  sensitive   = true
}
