# GCP 인프라

> 대상: 인프라 개발자<br>
> 학습 목표: FCM Push 인프라의 Terraform 관리 대상과 수동 단계를 확인한다<br>
> 위치: `infra/firebase`

FCM Push 알림 인프라를 선언적으로 관리합니다. FCM은 Firebase Cloud Messaging입니다.

## 관리 대상

- GCP 프로젝트. `google_project.bconnect`
- Firebase API 활성화. `google_project_service.required`
- Firebase 프로젝트 추가. `google_firebase_project.bconnect`
- Web App 2개. career · plan
- Web App SDK config 데이터 소스

## 사전작업

Terraform 은 `CLOUDSDK_CONFIG=~/.config/gcloud-morton` 경로의 ADC를 사용합니다. ADC는 Application Default Credentials입니다.

최초 1회 실행합니다.

```bash
gcloud auth application-default login
gcloud config set project bconnect-f0bee
```

- 자세한 gcloud 격리 설정은 프로젝트 루트 [.envrc](../../.envrc) 참고

## 수동 관리 대상

VAPID key 는 수동 생성 후 `terraform.tfvars`의 `firebase_vapid_key` 변수에 주입합니다.

- Firebase 가 VAPID key 생성 공개 API를 제공하지 않음
- 생성은 Firebase Console에서 수행

### 생성 절차

1. https://console.firebase.google.com/project/bconnect-f0bee/settings/cloudmessaging 접속
   - 또는 프로젝트 설정 → Cloud Messaging 탭
2. Web configuration 섹션 → Web Push certificates 영역 스크롤
3. "Generate key pair" 클릭. 최초 1회
4. 생성된 Key pair 값 복사. `BH...`로 시작하는 긴 문자열
5. `infra/terraform.tfvars`에 추가

   ```hcl
   firebase_vapid_key = "BH7...<복사한 값>"
   ```

6. `terraform plan` 확인 후 `terraform apply`

### 재사용·교체 정책

- 교체 금지. VAPID key 는 디바이스 토큰과 바인딩되어 있어 교체 시 기존 모든 토큰이 무효화됨
- 분실 시 Firebase Console에서 Generate key pair 로 새로 만들 수 있음
  - 이때 모든 사용자가 알림을 다시 허용해야 함
- 백업. `terraform.tfvars` 는 이미 gitignore 처리되어 S3 backend 에 state 로 저장됨

## Output

- `web_configs`. map 타입. 앱별 Firebase SDK config
  - `module.vercel` 에서 `NEXT_PUBLIC_FIREBASE_*` 환경변수로 주입
- `web_configs["career"]`, `web_configs["plan"]`

## 관련 이슈

- [#215](https://github.com/mortonCareer/bconnect/issues/215) Web Push 알림 인프라 구축. 이 모듈 최초 생성
- [#171](https://github.com/mortonCareer/bconnect/issues/171) MSW 도입. Mock Route Handler 제거 예정
