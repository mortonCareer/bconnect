data "aws_caller_identity" "current" {}

# 웹 푸시(FCM HTTP v1)용 SNS 플랫폼 애플리케이션
resource "aws_sns_platform_application" "fcm" {
  count = var.fcm_service_account_json != "" ? 1 : 0

  name                = "morton-fcm-webpush"
  platform            = "GCM"
  platform_credential = var.fcm_service_account_json

  success_feedback_role_arn    = aws_iam_role.sns_delivery_status[0].arn
  failure_feedback_role_arn    = aws_iam_role.sns_delivery_status[0].arn
  success_feedback_sample_rate = 100
}

# SNS delivery status → CloudWatch Logs 기록 역할
resource "aws_iam_role" "sns_delivery_status" {
  count = var.fcm_service_account_json != "" ? 1 : 0

  name = "morton-sns-delivery-status"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "sns.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy" "sns_delivery_status" {
  count = var.fcm_service_account_json != "" ? 1 : 0

  name = "sns-delivery-status-logs"
  role = aws_iam_role.sns_delivery_status[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:PutMetricFilter",
          "logs:PutRetentionPolicy"
        ]
        Resource = ["*"]
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "sns_push_success" {
  count = var.fcm_service_account_json != "" ? 1 : 0

  name              = "sns/${var.aws_region}/${data.aws_caller_identity.current.account_id}/app/GCM/morton-fcm-webpush"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "sns_push_failure" {
  count = var.fcm_service_account_json != "" ? 1 : 0

  name              = "sns/${var.aws_region}/${data.aws_caller_identity.current.account_id}/app/GCM/morton-fcm-webpush/Failure"
  retention_in_days = 30
}
