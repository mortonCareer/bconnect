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
}

resource "vercel_project_environment_variable" "career_api_url" {
  project_id = vercel_project.morton-career.id
  key        = "NEXT_PUBLIC_API_URL"
  value      = var.api_url
  target     = ["production", "preview", "development"]
}

# ===========================================================================
# Vercel Project for Morton Works Application
# ===========================================================================
resource "vercel_project" "morton-works" {
  name      = "${var.project_name}-works"
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

  root_directory = "apps/works"
}

resource "vercel_project_environment_variable" "works_api_url" {
  project_id = vercel_project.morton-works.id
  key        = "NEXT_PUBLIC_API_URL"
  value      = var.api_url
  target     = ["production", "preview", "development"]
}
