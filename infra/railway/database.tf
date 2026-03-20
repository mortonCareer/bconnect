resource "railway_service" "postgres" {
  name       = "Postgres"
  project_id = railway_project.morton.id

  source_image = "ghcr.io/railwayapp-templates/postgres-ssl:17"

  # Volume은 아직 Terraform으로 생성 불가하여 GUI에서 수동 생성 필요
  # GUI를 통해 생성된 Volume을 Terraform이 관리하지 않도록 설정
  lifecycle {
    ignore_changes = [volume]
  }

  volume = {
    mount_path = "/var/lib/postgresql/data"
    name       = "postgres-volume"
  }
}

resource "railway_variable" "postgres_user" {
  name           = "POSTGRES_USER"
  value          = var.db_user
  service_id     = railway_service.postgres.id
  environment_id = railway_project.morton.default_environment.id
}

resource "railway_variable" "postgres_password" {
  name           = "POSTGRES_PASSWORD"
  value          = var.db_password
  service_id     = railway_service.postgres.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.postgres_user]
}

resource "railway_variable" "postgres_db" {
  name           = "POSTGRES_DB"
  value          = var.db_name
  service_id     = railway_service.postgres.id
  environment_id = railway_project.morton.default_environment.id

  depends_on = [railway_variable.postgres_password]
}

# TCP proxy — 외부(Vercel, GitHub Actions)에서 Postgres 접근용
# provider가 railway_tcp_proxy를 미지원할 경우 Railway GUI에서 수동 활성화:
# Service → Settings → Networking → Public Networking → Enable TCP Proxy
resource "railway_tcp_proxy" "postgres" {
  service_id       = railway_service.postgres.id
  environment_id   = railway_project.morton.default_environment.id
  application_port = 5432
}
