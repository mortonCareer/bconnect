# KISCON Sync GitHub Actions 전용 IAM 유저
# S3 kiscon/* 경로만 읽기/쓰기 허용 (최소 권한)
resource "aws_iam_user" "kiscon_sync" {
  name = "morton-kiscon-sync"
  path = "/system/"
}

resource "aws_iam_access_key" "kiscon_sync_key" {
  user = aws_iam_user.kiscon_sync.name
}

resource "aws_iam_policy" "kiscon_sync_access" {
  name        = "MortonKisconSyncAccess"
  path        = "/"
  description = "KISCON sync script: S3 kiscon/* read/write only"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "KisconS3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.app_storage.arn}/kiscon/*"
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "kiscon_sync_attach" {
  user       = aws_iam_user.kiscon_sync.name
  policy_arn = aws_iam_policy.kiscon_sync_access.arn
}
