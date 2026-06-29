# 웹 푸시(FCM HTTP v1)용 SNS 플랫폼 애플리케이션. credential 미설정 시 생성 생략.
resource "aws_sns_platform_application" "fcm" {
  count = var.fcm_service_account_json != "" ? 1 : 0

  name                = "morton-fcm-webpush"
  platform            = "GCM"
  platform_credential = var.fcm_service_account_json
}
