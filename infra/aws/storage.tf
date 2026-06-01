# 애플리케이션 파일 저장용 S3 버킷
resource "aws_s3_bucket" "app_storage" {
  bucket = var.s3_bucket_name
}

# dev(staging) 환경 전용 버킷 — 테스트 파일이 prod 버킷에 섞이지 않도록 분리
resource "aws_s3_bucket" "app_storage_dev" {
  bucket = var.dev_s3_bucket_name
}
