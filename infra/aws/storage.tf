# 애플리케이션 파일 저장용 S3 버킷 (prod)
resource "aws_s3_bucket" "app_storage" {
  bucket = var.s3_bucket_name
}

# dev(staging) 환경 전용 버킷 — 테스트 파일이 prod 버킷에 섞이지 않도록 분리
resource "aws_s3_bucket" "app_storage_dev" {
  bucket = var.dev_s3_bucket_name
}

# 두 버킷 모두 완전 비공개 — CloudFront OAC 만 GetObject (아래 bucket policy).
# prod/dev 대칭 하드닝(#694). local.cdns 는 cloudfront.tf 에 정의.
resource "aws_s3_bucket_public_access_block" "app_storage" {
  for_each                = local.cdns
  bucket                  = each.value.bucket_id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront service principal 만, 그것도 해당 환경 distribution(SourceArn) 을 통해서만 읽기 허용.
# Service principal + 고정 SourceArn 이라 non-public → block_public_policy 와 무충돌.
resource "aws_s3_bucket_policy" "app_storage" {
  for_each = local.cdns
  bucket   = each.value.bucket_id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontOAC"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${each.value.bucket_arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.static[each.key].arn
        }
      }
    }]
  })
}
