resource "railway_project" "morton" {
  name           = var.project_name
  has_pr_deploys = true
}

resource "railway_environment" "dev" {
  name       = "dev"
  project_id = railway_project.morton.id
}

# resource "railway_custom_domain" "api" {
#   domain         = var.api_domain
#   service_id     = railway_service.api.id
#   environment_id = railway_project.morton.default_environment.id
# }
