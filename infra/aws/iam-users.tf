# ──────────────────────────────────────────────
# IAM 사용자 (사람 계정)
# 서비스 계정은 iam.tf, iam-kiscon-sync.tf 참조
#
# Access Key는 Terraform으로 관리하지 않음
# - secret이 tfstate에 평문 저장되는 보안 이슈
# - 콘솔에서 본인이 직접 생성/관리
# ──────────────────────────────────────────────

locals {
  human_users = {
    CTO = {
      groups = ["admin"]
      tags = {
        AKIATD5MAX5O3CBIMX7T = "GalaxyBook2 - Terraform"
      }
    }
    backend = {
      groups = ["developer"]
      tags   = {}
    }
    jeonjiwon = {
      groups = ["admin"]
      tags   = {}
    }
  }
}

resource "aws_iam_user" "humans" {
  for_each = local.human_users
  name     = each.key
  tags     = each.value.tags
}

resource "aws_iam_user_group_membership" "humans" {
  for_each = local.human_users
  user     = aws_iam_user.humans[each.key].name
  groups   = each.value.groups
}

# 비밀번호 변경 허용 (콘솔 로그인 사용자 공통)
resource "aws_iam_user_policy_attachment" "change_password" {
  for_each   = local.human_users
  user       = aws_iam_user.humans[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/IAMUserChangePassword"
}
