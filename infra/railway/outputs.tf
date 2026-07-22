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

output "dev_environment_id" {
  description = "dev(staging) environment ID"
  value       = railway_environment.dev.id
}

output "dev_api_domain" {
  description = "dev(staging) API Railway-generated domain (#352 Vercel dev env 주입용)"
  value       = railway_service_domain.api_dev.domain
}

output "dev_postgres_tcp_proxy" {
  description = "dev(staging) Postgres TCP proxy host:port (외부 접근용)"
  value       = "${railway_tcp_proxy.postgres_dev.domain}:${railway_tcp_proxy.postgres_dev.proxy_port}"
}
