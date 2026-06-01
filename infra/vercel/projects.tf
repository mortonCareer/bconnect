# ===========================================================================
# Vercel Project for Morton Career Application
# ===========================================================================
resource "vercel_project" "morton-career" {
  name      = "${var.project_name}-career"
  framework = "nextjs"

  automatically_expose_system_environment_variables = true

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
  sensitive  = true
  comment    = "AWS IAM - S3/Lambda 접근용"
}

resource "vercel_project_environment_variable" "career_aws_secret_access_key" {
  project_id = vercel_project.morton-career.id
  key        = "AWS_SECRET_ACCESS_KEY"
  value      = var.aws_secret_access_key
  target     = ["production", "preview"]
  sensitive  = true
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
  sensitive  = true
  comment    = "국세청 사업자등록정보 API (data.go.kr) - 원클릭 조회"
}

resource "vercel_project_environment_variable" "career_kcomwel_api_service_key" {
  project_id = vercel_project.morton-career.id
  key        = "KCOMWEL_API_SERVICE_KEY"
  value      = var.kcomwel_api_service_key
  target     = ["production", "preview"]
  sensitive  = true
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
  sensitive  = true
  comment    = "Vercel Cron 인증 시크릿 - 스키마 체크 크론잡"
}

# Sentry 소스맵 업로드 (DSN·org·project는 코드에 하드코딩)
resource "vercel_project_environment_variable" "career_sentry_auth_token" {
  count      = var.sentry_auth_token != "" ? 1 : 0
  project_id = vercel_project.morton-career.id
  key        = "SENTRY_AUTH_TOKEN"
  value      = var.sentry_auth_token
  target     = ["production", "preview"]
  sensitive  = true
  comment    = "Sentry auth token - 소스맵 업로드"
}

resource "vercel_project_environment_variable" "career_slack_webhook_url" {
  count      = var.slack_webhook_url != "" ? 1 : 0
  project_id = vercel_project.morton-career.id
  key        = "SLACK_WEBHOOK_URL"
  value      = var.slack_webhook_url
  target     = ["production"]
  sensitive  = true
  comment    = "Slack Incoming Webhook - 크롤링 스키마 변경 알림"
}

resource "vercel_project_environment_variable" "career_database_url" {
  project_id = vercel_project.morton-career.id
  key        = "DATABASE_URL"
  value      = var.database_url
  target     = ["production", "preview"]
  sensitive  = true
  comment    = "Railway Postgres - KISCON 건설업체정보 조회"
}

# ---------------------------------------------------------------------------
# Firebase Cloud Messaging (Web Push)
# ---------------------------------------------------------------------------
# NEXT_PUBLIC_* 는 클라이언트에 노출됨 (FCM 웹 SDK config는 공개 정보)
# VAPID_KEY도 공개 키라 NEXT_PUBLIC_ 접두사 사용 가능
resource "vercel_project_environment_variable" "career_firebase_api_key" {
  project_id = vercel_project.morton-career.id
  key        = "NEXT_PUBLIC_FIREBASE_API_KEY"
  value      = var.firebase_web_configs["career"].api_key
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web SDK - apiKey"
}

resource "vercel_project_environment_variable" "career_firebase_auth_domain" {
  project_id = vercel_project.morton-career.id
  key        = "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  value      = var.firebase_web_configs["career"].auth_domain
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web SDK - authDomain"
}

resource "vercel_project_environment_variable" "career_firebase_project_id" {
  project_id = vercel_project.morton-career.id
  key        = "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  value      = var.firebase_web_configs["career"].project_id
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web SDK - projectId"
}

resource "vercel_project_environment_variable" "career_firebase_storage_bucket" {
  project_id = vercel_project.morton-career.id
  key        = "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
  value      = var.firebase_web_configs["career"].storage_bucket
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web SDK - storageBucket"
}

resource "vercel_project_environment_variable" "career_firebase_messaging_sender_id" {
  project_id = vercel_project.morton-career.id
  key        = "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  value      = var.firebase_web_configs["career"].messaging_sender_id
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web SDK - messagingSenderId (FCM)"
}

resource "vercel_project_environment_variable" "career_firebase_app_id" {
  project_id = vercel_project.morton-career.id
  key        = "NEXT_PUBLIC_FIREBASE_APP_ID"
  value      = var.firebase_web_configs["career"].app_id
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web SDK - appId"
}

resource "vercel_project_environment_variable" "career_firebase_vapid_key" {
  count      = var.firebase_vapid_key != "" ? 1 : 0
  project_id = vercel_project.morton-career.id
  key        = "NEXT_PUBLIC_FIREBASE_VAPID_KEY"
  value      = var.firebase_vapid_key
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web Push VAPID public key (브라우저 구독 인증)"
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

  automatically_expose_system_environment_variables = true

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

# ---------------------------------------------------------------------------
# Firebase Cloud Messaging (Web Push) — career와 공통 Firebase Web App 공유
# ---------------------------------------------------------------------------
resource "vercel_project_environment_variable" "plan_firebase_api_key" {
  project_id = vercel_project.morton-plan.id
  key        = "NEXT_PUBLIC_FIREBASE_API_KEY"
  value      = var.firebase_web_configs["plan"].api_key
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web SDK - apiKey"
}

resource "vercel_project_environment_variable" "plan_firebase_auth_domain" {
  project_id = vercel_project.morton-plan.id
  key        = "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  value      = var.firebase_web_configs["plan"].auth_domain
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web SDK - authDomain"
}

resource "vercel_project_environment_variable" "plan_firebase_project_id" {
  project_id = vercel_project.morton-plan.id
  key        = "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  value      = var.firebase_web_configs["plan"].project_id
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web SDK - projectId"
}

resource "vercel_project_environment_variable" "plan_firebase_storage_bucket" {
  project_id = vercel_project.morton-plan.id
  key        = "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
  value      = var.firebase_web_configs["plan"].storage_bucket
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web SDK - storageBucket"
}

resource "vercel_project_environment_variable" "plan_firebase_messaging_sender_id" {
  project_id = vercel_project.morton-plan.id
  key        = "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  value      = var.firebase_web_configs["plan"].messaging_sender_id
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web SDK - messagingSenderId (FCM)"
}

resource "vercel_project_environment_variable" "plan_firebase_app_id" {
  project_id = vercel_project.morton-plan.id
  key        = "NEXT_PUBLIC_FIREBASE_APP_ID"
  value      = var.firebase_web_configs["plan"].app_id
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web SDK - appId"
}

resource "vercel_project_environment_variable" "plan_firebase_vapid_key" {
  count      = var.firebase_vapid_key != "" ? 1 : 0
  project_id = vercel_project.morton-plan.id
  key        = "NEXT_PUBLIC_FIREBASE_VAPID_KEY"
  value      = var.firebase_vapid_key
  target     = ["production", "preview", "development"]
  comment    = "Firebase Web Push VAPID public key (브라우저 구독 인증)"
}

# ===========================================================================
# Domain Configuration for Plan
# ===========================================================================
resource "vercel_project_domain" "plan" {
  project_id = vercel_project.morton-plan.id
  domain     = "plan.${var.domain}"
}

# ===========================================================================
# dev 브랜치 자동 preview 환경
# ===========================================================================
resource "vercel_custom_environment" "career_dev" {
  project_id  = vercel_project.morton-career.id
  name        = "dev"
  description = "dev branch 자동 deploy — staging-like preview"
  branch_tracking = {
    pattern = "dev"
    type    = "equals"
  }
}

resource "vercel_custom_environment" "plan_dev" {
  project_id  = vercel_project.morton-plan.id
  name        = "dev"
  description = "dev branch 자동 deploy — staging-like preview"
  branch_tracking = {
    pattern = "dev"
    type    = "equals"
  }
}

# ===========================================================================
# dev custom environment → Railway staging BE 연동 (#352, ADR-0010)
# ===========================================================================
resource "vercel_project_environment_variable" "career_dev_api_url" {
  project_id             = vercel_project.morton-career.id
  key                    = "NEXT_PUBLIC_API_URL"
  value                  = var.dev_api_url
  custom_environment_ids = [vercel_custom_environment.career_dev.id]
  comment                = "dev 브랜치 → Railway staging BE"
}

resource "vercel_project_environment_variable" "career_dev_api_mocking" {
  project_id             = vercel_project.morton-career.id
  key                    = "NEXT_PUBLIC_API_MOCKING"
  value                  = "disabled"
  custom_environment_ids = [vercel_custom_environment.career_dev.id]
  comment                = "dev 환경은 MSW mock 대신 실 staging BE 호출"
}

resource "vercel_project_environment_variable" "plan_dev_api_url" {
  project_id             = vercel_project.morton-plan.id
  key                    = "NEXT_PUBLIC_API_URL"
  value                  = var.dev_api_url
  custom_environment_ids = [vercel_custom_environment.plan_dev.id]
  comment                = "dev 브랜치 → Railway staging BE"
}

resource "vercel_project_environment_variable" "plan_dev_api_mocking" {
  project_id             = vercel_project.morton-plan.id
  key                    = "NEXT_PUBLIC_API_MOCKING"
  value                  = "disabled"
  custom_environment_ids = [vercel_custom_environment.plan_dev.id]
  comment                = "dev 환경은 MSW mock 대신 실 staging BE 호출"
}
