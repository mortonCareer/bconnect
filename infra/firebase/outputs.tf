output "project_id" {
  description = "GCP/Firebase 프로젝트 ID"
  value       = google_firebase_project.bconnect.project
}

# 프론트엔드 앱별 Firebase SDK config
# (Vercel 프로젝트의 NEXT_PUBLIC_FIREBASE_* 환경변수로 주입)
# 예: module.firebase.web_configs["career"].app_id
output "web_configs" {
  description = "Firebase 웹 앱 SDK config (career/plan)"
  value = {
    for key, _ in local.web_apps :
    key => {
      api_key             = data.google_firebase_web_app_config.apps[key].api_key
      auth_domain         = data.google_firebase_web_app_config.apps[key].auth_domain
      project_id          = google_firebase_project.bconnect.project
      storage_bucket      = data.google_firebase_web_app_config.apps[key].storage_bucket
      messaging_sender_id = data.google_firebase_web_app_config.apps[key].messaging_sender_id
      app_id              = google_firebase_web_app.apps[key].app_id
    }
  }
  sensitive = true
}
