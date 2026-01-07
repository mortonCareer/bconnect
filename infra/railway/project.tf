resource "railway_project" "morton" {
  name = var.project_name
}

# resource "railway_custom_domain" "api" {
#   domain         = var.api_domain
#   service_id     = railway_service.api.id
#   environment_id = railway_project.morton.default_environment.id
# }
