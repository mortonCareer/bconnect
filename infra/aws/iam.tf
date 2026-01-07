# 애플리케이션용 IAM 유저 생성
resource "aws_iam_user" "app_user" {
  name = "morton-app-storage-user"
  path = "/system/"
}

# 액세스 키 생성
resource "aws_iam_access_key" "app_key" {
  user = aws_iam_user.app_user.name
}

# S3 접근 권한 정책 생성
resource "aws_iam_policy" "s3_access" {
  name        = "MortonAppStorageAccess"
  path        = "/"
  description = "Allows access to the app storage S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_storage.arn,
          "${aws_s3_bucket.app_storage.arn}/*"
        ]
      }
    ]
  })
}

# 유저에게 정책 연결
resource "aws_iam_user_policy_attachment" "app_s3_attach" {
  user       = aws_iam_user.app_user.name
  policy_arn = aws_iam_policy.s3_access.arn
}
