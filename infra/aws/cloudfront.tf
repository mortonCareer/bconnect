# =============================================================================
# static.<domain> (prod) / static-dev.<domain> (dev) distribution
# — 유저 업로드 파일 서빙 (환경별 단일 버킷/단일 배포).
# public(profiles/posts)·signed-cookie private(chats/credentials/storages)를
# 버킷이 아닌 behavior 로 분기. 설계: docs/reference/specs/2026-04-12-file-infrastructure-design.md §3.1·§3.2
# prod/dev 는 for_each 파라미터화 — 서명키·cert·distribution 이 환경별로 격리된다.
# DNS(CNAME) 는 가비아 GUI 수동 — outputs.tf 참조.
# =============================================================================

locals {
  s3_origin_id = "s3-app-storage"

  # 환경별 CDN 파라미터. local 은 버킷 attr 만 참조(distribution 미참조) —
  # bucket_policy 가 distribution.arn 을 직접 참조하므로 여기 넣으면 cycle.
  cdns = {
    prod = {
      domain                 = "static.${var.domain}"
      bucket_id              = aws_s3_bucket.app_storage.id
      bucket_arn             = aws_s3_bucket.app_storage.arn
      bucket_regional_domain = aws_s3_bucket.app_storage.bucket_regional_domain_name
    }
    dev = {
      domain                 = "static-dev.${var.domain}"
      bucket_id              = aws_s3_bucket.app_storage_dev.id
      bucket_arn             = aws_s3_bucket.app_storage_dev.arn
      bucket_regional_domain = aws_s3_bucket.app_storage_dev.bucket_regional_domain_name
    }
  }
}

# Signed cookie 서명 키쌍 — 환경별 격리(#694). 개인키는 Spring 서버(Railway)가 보관.
resource "tls_private_key" "cf_signing" {
  for_each  = local.cdns
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "aws_cloudfront_public_key" "cf_signing" {
  for_each    = local.cdns
  name        = "bconnect-signed-cookie-${each.key}"
  encoded_key = tls_private_key.cf_signing[each.key].public_key_pem

  # key_group 이 이 공개키를 참조하므로, 이름 변경으로 교체될 때 새 것을 먼저
  # 만든 뒤 옛것을 지운다("public key in use" 삭제 에러 방지).
  lifecycle {
    create_before_destroy = true
  }
}

# Signed cookie 검증용 key group.
resource "aws_cloudfront_key_group" "signing" {
  for_each = local.cdns
  name     = "bconnect-signed-cookie-${each.key}"
  items    = [aws_cloudfront_public_key.cf_signing[each.key].id]
}

# CloudFront viewer 인증서 — us-east-1 필수, DNS validation.
# validation CNAME 은 가비아 수동 추가 (route53 리소스 없음).
resource "aws_acm_certificate" "static" {
  for_each          = local.cdns
  provider          = aws.us_east_1
  domain_name       = each.value.domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# 가비아에 CNAME 추가 후 cert 가 ISSUED 될 때까지 polling (record 는 관리 안 함).
# ⚠️ 단일 apply 로는 완료 불가 — DNS 가 수동(가비아)이라 아래 순서 필수:
#   1) terraform apply -target='module.aws.aws_acm_certificate.static'   (cert 만 생성)
#   2) terraform output acm_validation_records → 가비아 GUI 에 CNAME 추가 (prod·dev 각각)
#   3) terraform apply                                                   (ISSUED 확인 후 distribution)
# create timeout 20m — CNAME 누락/오타 시 75m 대신 20m 만에 실패.
resource "aws_acm_certificate_validation" "static" {
  for_each        = local.cdns
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.static[each.key].arn

  timeouts {
    create = "20m"
  }
}

# S3 origin 접근 제어 — bucket policy 로 CloudFront service principal 만 GetObject.
resource "aws_cloudfront_origin_access_control" "static" {
  for_each                          = local.cdns
  name                              = "static-s3-oac-${each.key}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# 관리형 캐시 정책 — 쿠키를 cache key 에서 제외(signed cookie 가 캐시 분할 안 함),
# origin Cache-Control 최대 1년 존중. 두 distribution 이 공유.
data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_distribution" "static" {
  for_each        = local.cdns
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${each.value.domain} — user uploads (public + signed-cookie private)"
  aliases         = [each.value.domain]
  price_class     = "PriceClass_200" # 한국(서울) edge 포함, 최소 비용

  origin {
    # 서울 버킷은 regional 도메인 필수 — 글로벌 도메인은 307 redirect + OAC SigV4 깨짐.
    domain_name              = each.value.bucket_regional_domain
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.static[each.key].id
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
    trusted_key_groups = [aws_cloudfront_key_group.signing[each.key].id]
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
    acm_certificate_arn      = aws_acm_certificate_validation.static[each.key].certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
