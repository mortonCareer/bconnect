resource "railway_service" "redis" {
  name       = "Redis"
  project_id = railway_project.morton.id

  source_image = "redis:7-alpine"

  # Volume은 아직 Terraform으로 생성 불가하여 GUI에서 수동 생성 필요
  # GUI를 통해 생성된 Volume을 Terraform이 관리하지 않도록 설정
  lifecycle {
    ignore_changes = [volume]
  }

  volume = {
    mount_path = "/data"
    name       = "redis-volume"
  }
}
