# Morton Career — Vercel 시크릿 로테이션 계획

## 배경

[Vercel April 2026 보안 인시던트](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident) — 제3자 AI 도구의 Google Workspace OAuth 자격증명 침해. `sensitive` 미표시 env var는 노출됐다고 간주하고 로테이션 권고.

morton-career는 7개 시크릿 모두 `encrypted`(기본) 타입이라 노출 가능. NEXT*PUBLIC_FIREBASE*\*, NEXT_PUBLIC_API_URL은 빌드 번들에 포함되는 공개 변수라 로테이션 대상 아님.

## 로테이션 대상 (7개)

| #   | 변수                                          | 환경                | 등급        | 발급처                                                      |
| --- | --------------------------------------------- | ------------------- | ----------- | ----------------------------------------------------------- |
| 1   | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | preview, production | 🔴 CRITICAL | AWS IAM 콘솔                                                |
| 2   | `DATABASE_URL`                                | preview, production | 🔴 CRITICAL | DB 매니지드 콘솔 (Neon/Supabase/RDS 등 — 실 위치 확인 필요) |
| 3   | `SENTRY_AUTH_TOKEN`                           | preview, production | 🟠 HIGH     | Sentry → Settings → Auth Tokens                             |
| 4   | `KCOMWEL_API_SERVICE_KEY`                     | preview, production | 🟠 HIGH     | 근로복지공단 OpenAPI 포털                                   |
| 5   | `NTS_API_SERVICE_KEY`                         | preview, production | 🟠 HIGH     | 국세청 OpenAPI 포털 (data.go.kr 등)                         |
| 6   | `SLACK_WEBHOOK_URL`                           | production          | 🟡 MEDIUM   | Slack Apps → Incoming Webhooks                              |
| 7   | `CRON_SECRET`                                 | production          | 🟡 MEDIUM   | 자가 생성 (`openssl rand -hex 32`)                          |

## 사전 점검

```bash
# 1. Vercel Activity Log 확인 (대시보드 morton 팀 → Activity)
#    - 4월 사고 기간 전후 비정상 env 조회/배포 트리거 흔적
#    - 특히 morton-career 프로젝트 한정으로 필터

# 2. AWS CloudTrail에서 비정상 사용 검사
#    조회 기간: 4월 사고 발표 시점부터 현재까지
#    아래 액션을 username=<morton-career-iam-user>로 필터
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=<iam-user-name> \
  --start-time 2026-04-01 \
  --query 'Events[].{Time:EventTime,Action:EventName,Source:SourceIPAddress}' \
  --output table

# 3. DB 접속 로그 확인 (매니지드면 콘솔, 자체 호스팅이면 pg_stat_activity)
#    의심스러운 IP/시간대 접속 여부

# 4. Sentry → Audit Log → 토큰 사용 이력
```

## 로테이션 절차

### 원칙

- **신규 키 발급 → Vercel 업데이트 → 배포 검증 → 구 키 비활성화** 순서. 동시 비활성화 금지(prod 다운)
- 모든 신규 등록은 `--sensitive` 타입 (이번 사고 예방)
- AWS IAM은 사용자당 최대 2개 키 동시 활성 가능 — 신구 병행 가능
- DB 패스워드는 한 번에 한 개만 — 재배포 완료 후 즉시 검증

### Step 1 — 신규 키 발급 (외부 콘솔)

| #   | 작업                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | AWS IAM Console → 해당 user → Security credentials → "Create access key" → 새 키 발급 (구 키는 아직 Active 유지)      |
| 2   | DB 콘솔 → 새 user 생성 또는 기존 user 패스워드 재설정 → 새 connection string 확보                                     |
| 3   | Sentry → Settings → Auth Tokens → "Create New Token" (필요 scope: `project:releases`, `org:read`) → 구 토큰 아직 유지 |
| 4   | 근로복지공단 포털 → API 키 재발급 (사이트별 절차 다름 — 보통 신청 후 발급까지 1-2일 소요 가능, **주의**)              |
| 5   | 국세청 포털 → 동일                                                                                                    |
| 6   | Slack → 해당 App → Incoming Webhooks → "Add New Webhook to Workspace" → 새 URL 확보                                   |
| 7   | `CRON_SECRET=$(openssl rand -hex 32)` → 메모                                                                          |

**리스크**: KCOMWEL/NTS 키 재발급은 정부 포털이라 즉시 발급 안 될 수 있음. 발급 신청부터 시작.

### Step 2 — Vercel API로 일괄 업데이트

`vercel link`는 사용 안 함 ([feedback_vercel_scope_isolation.md](../../../.claude/projects/-home-json-homelab-worktrees-main/memory/feedback_vercel_scope_isolation.md)) — REST API 직접 호출.

```bash
# 환경변수에 신규 값 미리 export (이 파일은 절대 커밋 금지, 셸 실행만)
export NEW_AWS_AKID="AKIA..."
export NEW_AWS_SAK="..."
export NEW_DB_URL="postgresql://..."
export NEW_SENTRY="sntrys_..."
export NEW_KCOMWEL="..."
export NEW_NTS="..."
export NEW_SLACK="https://hooks.slack.com/..."
export NEW_CRON=$(openssl rand -hex 32)

TOKEN=$(python3 -c "import json; print(json.load(open('/home/json/.local/share/com.vercel.cli/auth.json'))['token'])")
TEAM="team_EnZziswF6IjVpI7fwPK6Mjsp"
PROJ="morton-career"

upsert() {
  local key=$1 value=$2 targets=$3
  # 기존 변수 ID 조회
  local ids=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "https://api.vercel.com/v10/projects/$PROJ/env?teamId=$TEAM" \
    | python3 -c "
import json,sys
d=json.load(sys.stdin)
for e in d.get('envs',d):
    if e.get('key')=='$key': print(e['id'])
")
  # 기존 모두 삭제
  for id in $ids; do
    curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
      "https://api.vercel.com/v9/projects/$PROJ/env/$id?teamId=$TEAM" > /dev/null
  done
  # sensitive로 신규 추가
  local target_json=$(echo "$targets" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip().split(',')))")
  curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    "https://api.vercel.com/v10/projects/$PROJ/env?teamId=$TEAM&upsert=true" \
    -d "{\"key\":\"$key\",\"value\":\"$value\",\"type\":\"sensitive\",\"target\":$target_json}" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print('  ✓' if 'created' in d or d.get('key') else '  ✗', '$key', d.get('error',{}).get('message','OK'))"
}

upsert AWS_ACCESS_KEY_ID      "$NEW_AWS_AKID"   "preview,production"
upsert AWS_SECRET_ACCESS_KEY  "$NEW_AWS_SAK"    "preview,production"
upsert DATABASE_URL           "$NEW_DB_URL"     "preview,production"
upsert SENTRY_AUTH_TOKEN      "$NEW_SENTRY"     "preview,production"
upsert KCOMWEL_API_SERVICE_KEY "$NEW_KCOMWEL"   "preview,production"
upsert NTS_API_SERVICE_KEY    "$NEW_NTS"        "preview,production"
upsert SLACK_WEBHOOK_URL      "$NEW_SLACK"      "production"
upsert CRON_SECRET            "$NEW_CRON"       "production"
```

### Step 3 — 재배포 (production)

```bash
# 최신 production 배포 ID 조회 후 redeploy (코드 변경 없이 새 env 적용)
DEPLOY=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=$PROJ&teamId=$TEAM&target=production&limit=1" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['deployments'][0]['uid'])")

curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://api.vercel.com/v13/deployments?teamId=$TEAM&forceNew=1" \
  -d "{\"name\":\"$PROJ\",\"deploymentId\":\"$DEPLOY\",\"target\":\"production\"}"
```

### Step 4 — 검증 (smoke test)

| 항목                 | 방법                                                |
| -------------------- | --------------------------------------------------- |
| DB 연결              | 로그인/회원가입 → 데이터 조회 정상                  |
| AWS S3/SES 등        | 파일 업로드/메일 발송 기능                          |
| Sentry               | 새 배포 release tag 정상 등록 (Sentry 대시보드)     |
| KCOMWEL/NTS 외부 API | 해당 기능 페이지에서 데이터 fetch                   |
| Slack                | 알림 발생 트리거 → 채널 도착 확인                   |
| Cron                 | Vercel Cron 다음 실행 시 200 응답 (대시보드 → Cron) |

검증 실패 시 → 새 시크릿 값 오타 의심, 재확인 후 재등록. 절대 구 키 활성화로 롤백하지 말 것 (구 키는 아직 살아있음, 그대로 두면 됨).

### Step 5 — 구 키 비활성화 (배포 완료 24h 후)

```bash
# AWS
aws iam update-access-key --user-name <user> --access-key-id <OLD_AKID> --status Inactive
# 1주일 후 완전 삭제
aws iam delete-access-key --user-name <user> --access-key-id <OLD_AKID>

# DB: 구 user 삭제 또는 패스워드 무효화
# Sentry: Settings → Auth Tokens → 구 토큰 Revoke
# Slack: 구 webhook URL → Disable in App settings
# KCOMWEL/NTS: 포털에서 구 키 폐기 신청
# CRON_SECRET: 새 값으로 덮어썼으므로 자동 무효화
```

## 롤백

이번 작업은 **시크릿 값만** 변경하므로 코드 롤백 불필요. 검증 실패 시:

1. Vercel 대시보드에서 직전 production deployment "Promote" → 자동으로 직전 env 스냅샷으로 복귀? **NO** — env는 deployment에 고정되지 않고 latest 사용. 따라서 env 자체를 다시 바꿔야 함.
2. 안전책: Step 2 실행 전 현재 env 값을 백업
   ```bash
   # decrypt=true로 평문 다운로드 (sensitive는 다운로드 불가)
   curl -s -H "Authorization: Bearer $TOKEN" \
     "https://api.vercel.com/v10/projects/$PROJ/env?teamId=$TEAM&decrypt=true" \
     > /tmp/morton-career-env-backup-$(date +%Y%m%d).json
   chmod 600 /tmp/morton-career-env-backup-*.json
   ```
3. 백업 파일은 작업 완료 + 검증 안정화 1주일 후 `shred -u`로 삭제.

## 완료 후 추가 권장

1. **morton 팀 멤버 권한 점검** — `amang-web`이 morton에 잘못 생긴 경위 (이미 삭제 완료 2026-04-20)
2. **Vercel Project Create 권한 제한** — Owner만 생성 가능하게 변경
3. **(선택) Terraform vercel provider** — 프로젝트/env 선언적 관리, drift 감지

## 체크리스트 (실행 시 사용)

- [ ] Vercel Activity Log 확인 (4월 사고 기간)
- [ ] AWS CloudTrail 비정상 사용 점검
- [ ] DB 접속 로그 점검
- [ ] Sentry Audit Log 점검
- [ ] 백업: env decrypt 다운로드 → `/tmp/morton-career-env-backup-*.json`
- [ ] 7개 신규 키 발급 (KCOMWEL/NTS는 선행, 발급 지연 가능)
- [ ] Vercel API로 sensitive 타입 일괄 업데이트
- [ ] Production redeploy
- [ ] Smoke test 6개 항목
- [ ] 24h 후 구 키 비활성화
- [ ] 1주일 후 백업 파일 shred
- [ ] morton 팀 멤버 권한 점검
