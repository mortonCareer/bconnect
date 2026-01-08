output "project_id" {
  description = "Railway project ID"
  value       = railway_project.morton.id
}

output "api_service_id" {
  description = "API service ID"
  value       = railway_service.api.id
}

output "postgres_service_id" {
  description = "PostgreSQL service ID"
  value       = railway_service.postgres.id
}

output "api_domain" {
  description = "API custom domain"
  value       = "api.${var.domain}"
}
