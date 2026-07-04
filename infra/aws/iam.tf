# 애플리케이션용 IAM 유저
resource "aws_iam_user" "app_user" {
  name = "morton-app-storage-user"
  path = "/system/"
}

# 액세스 키
resource "aws_iam_access_key" "app_key" {
  user = aws_iam_user.app_user.name
}

# S3 + SNS 접근 권한 정책
resource "aws_iam_policy" "app_access" {
  name        = "MortonAppAccess"
  path        = "/"
  description = "Allows access to S3 bucket and SNS for SMS OTP"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_storage.arn,
          "${aws_s3_bucket.app_storage.arn}/*",
          aws_s3_bucket.app_storage_dev.arn,
          "${aws_s3_bucket.app_storage_dev.arn}/*"
        ]
      },
      {
        Sid    = "SNSAccess"
        Effect = "Allow"
        # Publish: SMS OTP + 웹 푸시 발송 / 나머지: 푸시 디바이스 endpoint 생명주기 관리
        Action = [
          "sns:Publish",
          "sns:CreatePlatformEndpoint",
          "sns:GetEndpointAttributes",
          "sns:SetEndpointAttributes",
          "sns:DeleteEndpoint"
        ]
        Resource = ["*"]
      }
    ]
  })
}

# 유저에게 정책 연결
resource "aws_iam_user_policy_attachment" "app_access_attach" {
  user       = aws_iam_user.app_user.name
  policy_arn = aws_iam_policy.app_access.arn
}

# Lambda invoke 권한 정책
resource "aws_iam_policy" "lambda_invoke" {
  name        = "MortonLambdaInvoke"
  path        = "/"
  description = "Allows invoking Lambda functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "lambda:InvokeFunction"
        Resource = "arn:aws:lambda:${var.aws_region}:*:function:instagram-parser"
      }
    ]
  })
}

# 유저에게 Lambda 정책 연결
resource "aws_iam_user_policy_attachment" "app_lambda_attach" {
  user       = aws_iam_user.app_user.name
  policy_arn = aws_iam_policy.lambda_invoke.arn
}
