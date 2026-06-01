provider "aws" {
  region = "ap-northeast-2"
}

resource "aws_iam_account_alias" "this" {
  # "morton"은 다른 AWS 계정이 선점하여 사용 불가
  # 로그인: https://morton-so.signin.aws.amazon.com/console
  account_alias = "morton-so"
}

module "aws" {
  source             = "./aws"
  s3_bucket_name     = var.s3_bucket_name
  dev_s3_bucket_name = var.dev_s3_bucket_name
}

module "railway" {
  source = "./railway"

  railway_token = var.railway_token
  project_name  = var.project_name
  github_repo   = var.github_repo
  github_branch = var.github_branch

  db_user     = var.db_user
  db_password = var.db_password
  db_name     = var.db_name

  dev_db_password = var.dev_db_password

  spring_profile = var.spring_profile
  jwt_secret     = var.jwt_secret
  dev_jwt_secret = var.dev_jwt_secret

  aws_access_key_id     = module.aws.access_key_id
  aws_secret_access_key = module.aws.secret_access_key
  aws_region            = var.aws_region
  s3_bucket_name        = var.s3_bucket_name
  dev_s3_bucket_name    = var.dev_s3_bucket_name

  domain = var.domain

  sentry_dsn = var.sentry_dsn

  solapi_api_key       = var.solapi_api_key
  solapi_api_secret    = var.solapi_api_secret
  solapi_sender_number = var.solapi_sender_number
}

module "firebase" {
  source = "./firebase"

  project_id         = var.firebase_project_id
  project_name       = var.firebase_project_name
  billing_account_id = var.firebase_billing_account_id
}

module "vercel" {
  source = "./vercel"

  vercel_api_token = var.vercel_api_token
  domain           = var.domain

  project_name  = var.project_name
  github_repo   = var.github_repo
  github_branch = var.github_branch

  aws_access_key_id     = module.aws.access_key_id
  aws_secret_access_key = module.aws.secret_access_key
  aws_region            = var.aws_region

  nts_api_service_key     = var.nts_api_service_key
  kcomwel_api_service_key = var.kcomwel_api_service_key

  slack_webhook_url = var.slack_webhook_url
  sentry_auth_token = var.sentry_auth_token
  database_url      = var.database_url

  # Firebase config → Vercel 환경변수로 주입 (앱별 map)
  firebase_web_configs = module.firebase.web_configs
  firebase_vapid_key   = var.firebase_vapid_key
}
