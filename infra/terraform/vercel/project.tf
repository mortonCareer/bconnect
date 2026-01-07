# A project that is connected to a git repository.
# Deployments will be created automatically
# on every branch push and merges onto the Production Branch.
resource "vercel_project" "morton-web" {
  name      = "morton-web"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = "mortonCareer/morton"
  }

  oidc_token_config = {
    enabled     = true
    issuer_mode = "team"
  }

  skew_protection = "12 hours"

  root_directory = "apps/web"
}
