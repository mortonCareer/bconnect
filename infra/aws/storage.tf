# 애플리케이션 파일 저장용 S3 버킷
resource "aws_s3_bucket" "app_storage" {
  bucket = var.s3_bucket_name
}
