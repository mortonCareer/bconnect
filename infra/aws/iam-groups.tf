# ──────────────────────────────────────────────
# IAM 그룹 & 정책 (사람 계정용)
# ──────────────────────────────────────────────

# ── admin 그룹 (기존 import) ──────────────────
resource "aws_iam_group" "admin" {
  name = "admin"
}

resource "aws_iam_group_policy_attachment" "admin_full" {
  group      = aws_iam_group.admin.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# ── developer 그룹 ────────────────────────────
resource "aws_iam_group" "developer" {
  name = "developer"
}

# 모든 리소스 읽기 전용
resource "aws_iam_group_policy_attachment" "developer_readonly" {
  group      = aws_iam_group.developer.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# CloudWatch 로그/메트릭 조회 + Lambda invoke
resource "aws_iam_policy" "developer_extra" {
  name        = "MortonDeveloperAccess"
  description = "Developer: CloudWatch monitoring + Lambda invoke"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchMonitoring"
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:GetDashboard",
          "cloudwatch:ListDashboards",
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "logs:GetLogRecord",
          "logs:GetQueryResults",
          "logs:StartQuery",
          "logs:StopQuery",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
        ]
        Resource = "*"
      },
      {
        Sid      = "LambdaInvoke"
        Effect   = "Allow"
        Action   = "lambda:InvokeFunction"
        Resource = "arn:aws:lambda:ap-northeast-2:*:function:*"
      },
    ]
  })
}

resource "aws_iam_group_policy_attachment" "developer_extra" {
  group      = aws_iam_group.developer.name
  policy_arn = aws_iam_policy.developer_extra.arn
}

# ── MFA 강제 정책 (모든 사람 계정 그룹에 적용) ──
resource "aws_iam_policy" "enforce_mfa" {
  name        = "MortonEnforceMFA"
  description = "MFA 미설정 시 IAM 셀프 관리 외 모든 액션 거부"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSelfManagement"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:DeactivateMFADevice",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ChangePassword",
          "iam:GetUser",
          "iam:ListUsers",
        ]
        Resource = "*"
      },
      {
        Sid       = "DenyAllWithoutMFA"
        Effect    = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ChangePassword",
          "iam:GetUser",
          "sts:GetSessionToken",
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      },
    ]
  })
}

resource "aws_iam_group_policy_attachment" "admin_mfa" {
  group      = aws_iam_group.admin.name
  policy_arn = aws_iam_policy.enforce_mfa.arn
}

resource "aws_iam_group_policy_attachment" "developer_mfa" {
  group      = aws_iam_group.developer.name
  policy_arn = aws_iam_policy.enforce_mfa.arn
}
