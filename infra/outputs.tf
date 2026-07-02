# CloudFront static CDN — 가비아(수동 DNS)에 추가할 값 노출.
# apply 후 `terraform output` 으로 확인 → 가비아 GUI 에 CNAME 2개 추가.

output "cloudfront_distribution_domain" {
  description = "static.<domain> CNAME 타겟 (dxxx.cloudfront.net). 가비아 수동 추가"
  value       = module.aws.cloudfront_distribution_domain
}

output "acm_validation_records" {
  description = "ACM DNS validation CNAME (domain → {name, type, value} 맵). 가비아 수동 추가 후 cert ISSUED"
  value       = module.aws.acm_validation_records
}
