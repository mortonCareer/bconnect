# CloudFront static CDN (prod·dev) — 가비아(수동 DNS)에 추가할 값 노출.
# apply 후 `terraform output` 으로 확인 → 가비아 GUI 에 환경별 CNAME 추가:
#   prod: static.<domain>      alias + validation CNAME
#   dev : static-dev.<domain>  alias + validation CNAME

output "cloudfront_distribution_domain" {
  description = "환경별 CNAME 타겟 맵 (env → dxxx.cloudfront.net). static/static-dev 를 가비아 수동 추가"
  value       = module.aws.cloudfront_distribution_domain
}

output "acm_validation_records" {
  description = "ACM DNS validation CNAME (env → domain → {name, type, value}). 가비아 수동 추가 후 cert ISSUED"
  value       = module.aws.acm_validation_records
}
