resource "railway_service" "postgres" {
  name       = "postgres"
  project_id = railway_project.morton.id

  source_image = "ghcr.io/railwayapp-templates/postgres-ssl:17"
}

resource "railway_service_domain" "postgres_domain" {
  service_id = railway_service.postgres.id
  environment_id = railway_project.morton.default_environment.id
  domain = "" # Railway automatically assigns a domain
}

resource "railway_tcp_proxy" "postgres_proxy" {
  service_id = railway_service.postgres.id
  environment_id = railway_project.morton.default_environment.id
  application_port = 5432
}

resource "railway_volume" "postgres_volume" {
  name       = "pg-data"
  project_id = railway_project.morton.id
  service_id = railway_service.postgres.id
  mount_path = "/var/lib/postgresql/data"
}

resource "railway_variable" "postgres_user" {
  name         = "POSTGRES_USER"
  value        = var.db_user
  service_id   = railway_service.postgres.id
  environment_id = railway_project.morton.default_environment.id
}

resource "railway_variable" "postgres_password" {
  name         = "POSTGRES_PASSWORD"
  value        = var.db_password
  service_id   = railway_service.postgres.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.postgres_user]
}

resource "railway_variable" "postgres_db" {
  name         = "POSTGRES_DB"
  value        = var.db_name
  service_id   = railway_service.postgres.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.postgres_password]
}
