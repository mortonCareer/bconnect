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
}

# ===========================================================================
# Domain Configuration for Plan
# ===========================================================================
resource "vercel_project_domain" "plan" {
  project_id = vercel_project.morton-plan.id
  domain     = "plan.${var.domain}"
}
