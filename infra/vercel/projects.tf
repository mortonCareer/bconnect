# ===========================================================================
# Vercel Project for Morton Career Application
# ===========================================================================
resource "vercel_project" "morton-career" {
  name      = "${var.project_name}-career"
  framework = "nextjs"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = var.github_branch
  }

  oidc_token_config = {
    enabled     = true
    issuer_mode = "team"
  }

  skew_protection = "12 hours"

  root_directory = "apps/career"

  # 모노레포: apps/career 또는 packages 변경 시에만 빌드
  # VERCEL_GIT_PREVIOUS_SHA 미설정 시 main 분기점 기준, 둘 다 실패하면 빌드 강제
  ignore_command = "COMPARE=$${VERCEL_GIT_PREVIOUS_SHA:-$(git merge-base HEAD origin/main 2>/dev/null)}; [ -z \"$COMPARE\" ] && exit 1; git diff \"$COMPARE\" HEAD --quiet -- apps/career packages"

  # Preview deployments are publicly accessible (no Vercel authentication required)
  vercel_authentication = {
    deployment_type = "none"
  }
}

resource "vercel_project_environment_variable" "career_api_url" {
  project_id = vercel_project.morton-career.id
  key        = "NEXT_PUBLIC_API_URL"
  value      = "https://api.${var.domain}"
  target     = ["production", "preview", "development"]
  comment    = "Spring Boot API 서버 base URL"
}

resource "vercel_project_environment_variable" "career_aws_access_key_id" {
  project_id = vercel_project.morton-career.id
  key        = "AWS_ACCESS_KEY_ID"
  value      = var.aws_access_key_id
  target     = ["production", "preview"]
  comment    = "AWS IAM - S3/Lambda 접근용"
}

resource "vercel_project_environment_variable" "career_aws_secret_access_key" {
  project_id = vercel_project.morton-career.id
  key        = "AWS_SECRET_ACCESS_KEY"
  value      = var.aws_secret_access_key
  target     = ["production", "preview"]
  comment    = "AWS IAM - S3/Lambda 접근용"
}

resource "vercel_project_environment_variable" "career_aws_region" {
  project_id = vercel_project.morton-career.id
  key        = "AWS_REGION"
  value      = var.aws_region
  target     = ["production", "preview"]
  comment    = "AWS 리전 (ap-northeast-2)"
}

resource "vercel_project_environment_variable" "career_nts_api_service_key" {
  project_id = vercel_project.morton-career.id
  key        = "NTS_API_SERVICE_KEY"
  value      = var.nts_api_service_key
  target     = ["production", "preview"]
  comment    = "국세청 사업자등록정보 API (data.go.kr) - 원클릭 조회"
}

resource "vercel_project_environment_variable" "career_kcomwel_api_service_key" {
  project_id = vercel_project.morton-career.id
  key        = "KCOMWEL_API_SERVICE_KEY"
  value      = var.kcomwel_api_service_key
  target     = ["production", "preview"]
  comment    = "근로복지공단 고용/산재보험 API (data.go.kr) - 원클릭 조회"
}

# Vercel Cron 인증용 시크릿 (자동 생성)
resource "random_password" "cron_secret" {
  length  = 32
  special = false
}

resource "vercel_project_environment_variable" "career_cron_secret" {
  project_id = vercel_project.morton-career.id
  key        = "CRON_SECRET"
  value      = random_password.cron_secret.result
  target     = ["production"]
  comment    = "Vercel Cron 인증 시크릿 - 스키마 체크 크론잡"
}

# Sentry 소스맵 업로드 (DSN·org·project는 코드에 하드코딩)
resource "vercel_project_environment_variable" "career_sentry_auth_token" {
  count      = var.sentry_auth_token != "" ? 1 : 0
  project_id = vercel_project.morton-career.id
  key        = "SENTRY_AUTH_TOKEN"
  value      = var.sentry_auth_token
  target     = ["production", "preview"]
  comment    = "Sentry auth token - 소스맵 업로드"
}

resource "vercel_project_environment_variable" "career_slack_webhook_url" {
  count      = var.slack_webhook_url != "" ? 1 : 0
  project_id = vercel_project.morton-career.id
  key        = "SLACK_WEBHOOK_URL"
  value      = var.slack_webhook_url
  target     = ["production"]
  comment    = "Slack Incoming Webhook - 크롤링 스키마 변경 알림"
}

# ===========================================================================
# Domain Configuration for Career
# ===========================================================================
resource "vercel_project_domain" "career_root" {
  project_id = vercel_project.morton-career.id
  domain     = var.domain
}

resource "vercel_project_domain" "career_www" {
  project_id = vercel_project.morton-career.id
  domain     = "www.${var.domain}"
  redirect   = vercel_project_domain.career_root.domain
}

# ===========================================================================
# Vercel Project for Morton Plan Application
# ===========================================================================
resource "vercel_project" "morton-plan" {
  name      = "${var.project_name}-plan"
  framework = "nextjs"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = var.github_branch
  }

  oidc_token_config = {
    enabled     = true
    issuer_mode = "team"
  }

  skew_protection = "12 hours"

  root_directory = "apps/plan"

  # 모노레포: apps/plan 또는 packages 변경 시에만 빌드
  # VERCEL_GIT_PREVIOUS_SHA 미설정 시 main 분기점 기준, 둘 다 실패하면 빌드 강제
  ignore_command = "COMPARE=$${VERCEL_GIT_PREVIOUS_SHA:-$(git merge-base HEAD origin/main 2>/dev/null)}; [ -z \"$COMPARE\" ] && exit 1; git diff \"$COMPARE\" HEAD --quiet -- apps/plan packages"

  # Preview deployments are publicly accessible (no Vercel authentication required)
  vercel_authentication = {
    deployment_type = "none"
  }
}

resource "vercel_project_environment_variable" "plan_api_url" {
  project_id = vercel_project.morton-plan.id
  key        = "NEXT_PUBLIC_API_URL"
  value      = "https://api.${var.domain}"
  target     = ["production", "preview", "development"]
  comment    = "Spring Boot API 서버 base URL"
}

# ===========================================================================
# Domain Configuration for Plan
# ===========================================================================
resource "vercel_project_domain" "plan" {
  project_id = vercel_project.morton-plan.id
  domain     = "plan.${var.domain}"
}
