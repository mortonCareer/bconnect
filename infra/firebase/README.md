# Firebase 인프라 모듈

FCM (Firebase Cloud Messaging) Web Push 알림 인프라를 선언적으로 관리합니다.

관련 문서: [알림 인프라 (FCM Web Push) — Notion](https://www.notion.so/340965d2888b815b929ce3ddc3fe493f)

## 관리 대상

- GCP 프로젝트 (`google_project.bconnect`)
- Firebase API 활성화 (`google_project_service.required`)
- Firebase 프로젝트 추가 (`google_firebase_project.bconnect`)
- Web App 2개 (career / plan) — 동산보드는 career 에 흡수
- Web App SDK config 데이터 소스

## 선언적으로 관리되지 않는 것

### VAPID public key (수동 생성 필수)

Firebase 가 VAPID key 생성 공개 API를 제공하지 않아 **Firebase Console에서 수동 생성** 후 `terraform.tfvars`의 `firebase_vapid_key` 변수에 주입합니다.

#### 생성 절차

1. https://console.firebase.google.com/project/bconnect-f0bee/settings/cloudmessaging 접속
   - 또는 프로젝트 설정 → **Cloud Messaging** 탭
2. **Web configuration** 섹션 → **Web Push certificates** 영역 스크롤
3. **"Generate key pair"** 클릭 (최초 1회)
4. 생성된 **Key pair** 값 복사 (`BH...`로 시작하는 긴 문자열)
5. `infra/terraform.tfvars`에 추가:

   ```hcl
   firebase_vapid_key = "BH7...<복사한 값>"
   ```

6. `terraform plan` 확인 후 `terraform apply`

#### 재사용/교체 정책

- **교체 금지** — VAPID key 는 디바이스 토큰과 바인딩되어 있어 교체 시 기존 모든 토큰이 무효화됨
- **분실 시** — Firebase Console에서 Generate key pair 로 새로 만들 수 있지만, 이때 모든 사용자가 알림을 다시 허용해야 함
- **백업** — `terraform.tfvars` 는 이미 gitignore 처리되어 S3 backend 에 state 로 저장됨

#### Firebase API 가 추가되면 (Future)

Google 이 VAPID key 관리 API 를 추가하면 이 모듈에 다음 리소스가 추가되어야 합니다 (추정):

```hcl
# (Future — API 아직 없음)
resource "google_firebase_messaging_vapid_key" "bconnect" {
  provider = google-beta
  project  = google_firebase_project.bconnect.project
  # ...
}
```

현재는 `variables.tf`의 `firebase_vapid_key` 변수로 관리.

## 인증

Terraform 은 `CLOUDSDK_CONFIG=~/.config/gcloud-morton` 경로의 ADC (Application Default Credentials)를 사용합니다. 최초 1회:

```bash
gcloud auth application-default login
gcloud config set project bconnect-f0bee
```

자세한 gcloud 격리 설정은 프로젝트 루트 [.envrc](../../.envrc) 참고.

## Output

- `web_configs` (map) — 앱별 Firebase SDK config. `module.vercel` 에서 `NEXT_PUBLIC_FIREBASE_*` 환경변수로 주입.
  - `web_configs["career"]`, `web_configs["plan"]`

## 관련 이슈

- [#215](https://github.com/mortonCareer/bconnect/issues/215) Web Push 알림 인프라 구축 (이 모듈 최초 생성)
- [#171](https://github.com/mortonCareer/bconnect/issues/171) MSW 도입 — Mock Route Handler 제거 예정
