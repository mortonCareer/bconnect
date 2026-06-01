resource "railway_project" "morton" {
  name = var.project_name
}

# dev(staging) environment — ADR-0009/0010. dev 브랜치를 추적하는 staging BE.
# Railway GUI 에서 prod 복제로 생성된 환경을 terraform import 로 흡수:
#   terraform import 'module.railway.railway_environment.dev' <project_id>:dev
# community provider 가 환경 생성 시 prod 서비스를 fork 하지 않으므로 GUI 복제가 필요.
# 환경별 source branch override(dev) 는 Railway GUI 1회 수동 — TF state 밖(volume 패턴 동일).
resource "railway_environment" "dev" {
  name       = "dev"
  project_id = railway_project.morton.id
}

# resource "railway_custom_domain" "api" {
#   domain         = var.api_domain
#   service_id     = railway_service.api.id
#   environment_id = railway_project.morton.default_environment.id
# }
