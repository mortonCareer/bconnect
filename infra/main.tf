provider "aws" {
  region = "ap-northeast-2"
}

module "aws" {
  source         = "./aws"
  s3_bucket_name = var.s3_bucket_name
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

  spring_profile = var.spring_profile
  jwt_secret     = var.jwt_secret

  aws_access_key_id     = module.aws.access_key_id
  aws_secret_access_key = module.aws.secret_access_key
  aws_region            = var.aws_region
  s3_bucket_name        = var.s3_bucket_name

  domain = var.domain

  sentry_dsn = var.sentry_dsn
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

  nts_api_service_key    = var.nts_api_service_key
  kcomwel_api_service_key = var.kcomwel_api_service_key

  slack_webhook_url  = var.slack_webhook_url
  sentry_auth_token  = var.sentry_auth_token
}
