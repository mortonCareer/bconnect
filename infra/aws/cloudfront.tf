resource "tls_private_key" "cf_signing" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "aws_cloudfront_public_key" "cf_signing" {
  name        = "bconnect-signed-cookie"
  encoded_key = tls_private_key.cf_signing.public_key_pem
}

# =============================================================================
# static.<domain> distribution — 유저 업로드 파일 서빙 (단일 버킷/단일 배포).
# public(profiles/posts)·signed-cookie private(chats/credentials/storages)를
# 버킷이 아닌 behavior 로 분기. 설계: docs/reference/specs/2026-04-12-file-infrastructure-design.md §3.2
# DNS(CNAME) 는 가비아 GUI 수동 — outputs.tf 참조.
# =============================================================================

locals {
  static_domain = "static.${var.domain}"
  s3_origin_id  = "s3-app-storage"
}

# CloudFront viewer 인증서 — us-east-1 필수, DNS validation.
# validation CNAME 은 가비아 수동 추가 (route53 리소스 없음).
resource "aws_acm_certificate" "static" {
  provider          = aws.us_east_1
  domain_name       = local.static_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# 가비아에 CNAME 추가 후 cert 가 ISSUED 될 때까지 polling (record 는 관리 안 함).
# ⚠️ 단일 apply 로는 완료 불가 — DNS 가 수동(가비아)이라 아래 순서 필수:
#   1) terraform apply -target=module.aws.aws_acm_certificate.static   (cert 만 생성)
#   2) terraform output acm_validation_records → 가비아 GUI 에 CNAME 추가
#   3) terraform apply                                                 (ISSUED 확인 후 distribution)
# create timeout 20m — CNAME 누락/오타 시 75m 대신 20m 만에 실패.
resource "aws_acm_certificate_validation" "static" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.static.arn

  timeouts {
    create = "20m"
  }
}

# Signed cookie 검증용 key group — 기존 공개키(#687) 래핑.
resource "aws_cloudfront_key_group" "signing" {
  name  = "bconnect-signed-cookie"
  items = [aws_cloudfront_public_key.cf_signing.id]
}

# S3 origin 접근 제어 — bucket policy 로 CloudFront service principal 만 GetObject.
resource "aws_cloudfront_origin_access_control" "static" {
  name                              = "static-s3-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# 관리형 캐시 정책 — 쿠키를 cache key 에서 제외(signed cookie 가 캐시 분할 안 함),
# origin Cache-Control 최대 1년 존중.
data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_distribution" "static" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "static.bconnect.to — user uploads (public + signed-cookie private)"
  aliases         = [local.static_domain]
  price_class     = "PriceClass_200" # 한국(서울) edge 포함, 최소 비용

  origin {
    # 서울 버킷은 regional 도메인 필수 — 글로벌 도메인은 307 redirect + OAC SigV4 깨짐.
    domain_name              = aws_s3_bucket.app_storage.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.static.id
  }

  # default = private fail-safe: 유효 signed cookie 없으면 403.
  # profiles/posts 외 전 경로(chats/credentials/storages/미지정)가 여기로 떨어짐.
  default_cache_behavior {
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
    # SECURITY-CRITICAL: 이 줄 제거 시 credentials(신분증 등) 포함 전 private 객체가
    # world-readable 로 노출됨 — S3 레이어 backstop 없음(OAC 는 ${arn}/* 전체 허용).
    trusted_key_groups = [aws_cloudfront_key_group.signing.id]
  }

  # public override — profiles (capability URL, 쿠키 불필요)
  ordered_cache_behavior {
    path_pattern           = "profiles/*"
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
  }

  # public override — posts
  ordered_cache_behavior {
    path_pattern           = "posts/*"
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
  }

  # cert 가 ISSUED 된 뒤에만 배포 생성/연결되도록 validation 리소스를 참조.
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.static.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
