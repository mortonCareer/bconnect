terraform {
  required_providers {
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.0"
    }
  }
}

provider "google-beta" {
  # GOOGLE_APPLICATION_CREDENTIALS 환경변수 또는
  # gcloud auth application-default login 으로 인증
  region = var.region
}

# GCP 프로젝트 생성 (Firebase가 올라갈 하위 프로젝트)
resource "google_project" "bconnect" {
  provider   = google-beta
  project_id = var.project_id
  name       = var.project_name

  # 결제 계정 연결 (Spark 플랜이면 null)
  billing_account = var.billing_account_id

  labels = {
    environment = "prod"
    managed_by  = "terraform"
  }
}

# 필요한 GCP API 활성화
resource "google_project_service" "required" {
  provider = google-beta
  project  = google_project.bconnect.project_id

  for_each = toset([
    "firebase.googleapis.com",
    "fcm.googleapis.com",
    "cloudresourcemanager.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

# GCP 프로젝트에 Firebase 추가
resource "google_firebase_project" "bconnect" {
  provider = google-beta
  project  = google_project.bconnect.project_id

  depends_on = [google_project_service.required]
}

# Firebase Admin SDK 서비스계정에 FCM 발송 권한 부여.
# firebase-admin SDK 서버 푸시(messages:send)는 cloudmessaging.messages.create 가 필요한데
# adminsdk 서비스계정에 기본 부여되지 않음 → 명시적으로 바인딩 (없으면 403 mismatched-credential).
resource "google_project_iam_member" "adminsdk_fcm_sender" {
  provider = google-beta
  project  = google_firebase_project.bconnect.project
  role     = "roles/firebasecloudmessaging.admin"
  member   = "serviceAccount:firebase-adminsdk-fbsvc@${google_project.bconnect.project_id}.iam.gserviceaccount.com"
}

# Firebase 웹 앱 등록 (프론트엔드 앱별로 분리)
#
# FCM 자체는 projectId + messagingSenderId + VAPID로 라우팅되어 web app이 공통이어도 동작하지만,
# 앱을 분리해두면 향후 Analytics/Crashlytics/App Check 도입 시 앱별 분리가 자동으로 됨.
# web app 생성/보유 비용은 0이라 처음부터 분리하는 게 마이그레이션 비용을 줄임.
locals {
  web_apps = {
    career = "BConnect Career" # 기술자 PWA
    plan   = "BConnect Plan"   # 업체/건축주 웹
  }
}

resource "google_firebase_web_app" "apps" {
  for_each = local.web_apps

  provider     = google-beta
  project      = google_firebase_project.bconnect.project
  display_name = each.value

  deletion_policy = "DELETE"
}

# 각 웹 앱의 SDK config 조회 (Firebase Console의 설정 객체)
data "google_firebase_web_app_config" "apps" {
  for_each = local.web_apps

  provider   = google-beta
  project    = google_firebase_project.bconnect.project
  web_app_id = google_firebase_web_app.apps[each.key].app_id
}
