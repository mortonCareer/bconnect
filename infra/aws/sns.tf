# SNS SMS 설정
# OTP 인증용 SMS 발송 설정

# SMS 기본 설정 (계정 레벨)
resource "aws_sns_sms_preferences" "sms_preferences" {
  # Transactional: OTP, 알림 등 중요 메시지 (배달률 우선)
  # Promotional: 마케팅 메시지 (비용 우선)
  default_sms_type = "Transactional"

  # 월간 SMS 지출 한도 (USD)
  # 초과 시 SMS 발송 중단 → 과금 폭탄 방지
  monthly_spend_limit = 10
}