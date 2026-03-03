# ===========================================================================
# Deployment Trigger 설정 (Wait for CI)
#
# Railway Terraform provider에 deployment trigger 리소스가 없어서
# GraphQL API를 직접 호출하는 스크립트로 설정한다.
# ===========================================================================

resource "terraform_data" "api_deploy_settings" {
  triggers_replace = [railway_service.api.id]

  provisioner "local-exec" {
    command     = "${path.module}/scripts/configure-deploy-triggers.sh"
    interpreter = ["bash"]

    environment = {
      RAILWAY_TOKEN  = var.railway_token
      SERVICE_ID     = railway_service.api.id
      PROJECT_ID     = railway_project.morton.id
      ENVIRONMENT_ID = railway_project.morton.default_environment.id
    }
  }

  depends_on = [railway_service.api]
}
