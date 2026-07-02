# 애플리케이션 파일 저장용 S3 버킷
resource "aws_s3_bucket" "app_storage" {
  bucket = var.s3_bucket_name
}

# dev(staging) 환경 전용 버킷 — 테스트 파일이 prod 버킷에 섞이지 않도록 분리
resource "aws_s3_bucket" "app_storage_dev" {
  bucket = var.dev_s3_bucket_name
}

# 저장 시 암호화 (SSE-S3). AWS 계정 기본이 이미 AES256 이나 §9.2 대로 선언적 명시.
resource "aws_s3_bucket_server_side_encryption_configuration" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# app_storage 는 완전 비공개 — CloudFront OAC 만 GetObject (아래 bucket policy).
resource "aws_s3_bucket_public_access_block" "app_storage" {
  bucket                  = aws_s3_bucket.app_storage.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront service principal 만, 그것도 이 distribution(SourceArn) 을 통해서만 읽기 허용.
# Service principal + 고정 SourceArn 이라 non-public → block_public_policy 와 무충돌.
resource "aws_s3_bucket_policy" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontOAC"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.app_storage.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.static.arn
        }
      }
    }]
  })
}
