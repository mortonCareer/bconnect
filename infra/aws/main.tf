resource "aws_s3_bucket" "tfstate" {
  bucket = "morton-terraform-state"

  # 실수로 버킷을 삭제하는 것을 방지
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tfstate_versioning" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}
