# Morton 세션 핸드오프 — Vercel 4월 2026 인시던트 대응 (Plan B)

홈랩 세션에서 작업 중단, Morton 워크트리에서 이어서 진행. 이 문서를 새 세션에 그대로 전달.

## 작업 목표

morton-career의 시크릿 8개를 **Vercel `encrypted` → `sensitive` 타입으로 마이그레이션**. **값 자체는 회전하지 않음** (외부 서비스 신규 키 발급 노가다 생략). + AWS CloudTrail로 사고 기간 비정상 사용 흔적 점검.

## 결정 배경

- Vercel 4월 사고: 비-sensitive env var가 제3자 OAuth 침해로 노출 가능 ([게시판](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident))
- Vercel은 "limited subset에 직접 통보" — manamana32321@gmail.com 받은편지함 + 스팸함 확인 결과 **메일 없음** → 본인 영향 가능성 낮음 (~5% 미만)
- 런칭 전 + 메일 없음 → 전체 회전 ROI 낮음
- 미래 사고 대비 가치는 명확 → **sensitive 마이그레이션은 무조건 함**
- CloudTrail audit으로 잔존 리스크 95→99% 해소

## 이전 세션에서 완료된 작업

1. ✅ Vercel morton 팀 정리: leftover 3개 삭제 (`amang-web`, `frontend`, `feat-one-click-api`)
2. ✅ 인벤토리 확정: morton 팀 = `morton-career`, `morton-plan`, `sme-tour`(홈랩 이전 예정)
3. ✅ Vercel events 4/9~4/20 점검: 모두 본인 활동, 의심 없음
4. ✅ AWS IAM 식별: account `214572253021`, 앱 전용 user `morton-app-storage-user` (CTO 본인 키와 분리됨 — best practice). AKID는 새 세션에서 `aws iam list-access-keys --user-name morton-app-storage-user --profile morton-mfa`로 조회
5. ✅ Gmail MCP 셋업 완료 (다음 세션부터 자동 활성화)
6. ✅ 풀 회전 계획서 작성 완료: [`docs/plans/2026-04-20-morton-career-secret-rotation.md`](./2026-04-20-morton-career-secret-rotation.md) — 참고용, 이번엔 미실행

## morton-career env vars 현황 (17개)

```
[encrypted] AWS_ACCESS_KEY_ID            target=preview,production    ← 마이그레이션 ⭐
[encrypted] AWS_SECRET_ACCESS_KEY        target=preview,production    ← 마이그레이션 ⭐
[encrypted] DATABASE_URL                 target=preview,production    ← 마이그레이션 ⭐
[encrypted] SENTRY_AUTH_TOKEN            target=preview,production    ← 마이그레이션 ⭐
[encrypted] KCOMWEL_API_SERVICE_KEY      target=preview,production    ← 마이그레이션 ⭐
[encrypted] NTS_API_SERVICE_KEY          target=preview,production    ← 마이그레이션 ⭐
[encrypted] SLACK_WEBHOOK_URL            target=production            ← 마이그레이션 ⭐
[encrypted] CRON_SECRET                  target=production            ← 마이그레이션 ⭐
[encrypted] AWS_REGION                   target=preview,production    ← 시크릿 아님, 마이그 불필요
[encrypted] NEXT_PUBLIC_FIREBASE_*  (7개) target=all                  ← 공개 변수, 불필요
[encrypted] NEXT_PUBLIC_API_URL          target=all                   ← 공개, 불필요
```

## 실행 계획

### Step 0: 환경 확인

```bash
# Vercel token
TOKEN=$(python3 -c "import json; print(json.load(open('/home/json/.local/share/com.vercel.cli/auth.json'))['token'])")
TEAM="team_EnZziswF6IjVpI7fwPK6Mjsp"
PROJ="morton-career"
echo "Token: ${TOKEN:0:10}..."

# 현재 env 상태 확인 (8개 시크릿이 모두 encrypted여야 함)
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v10/projects/$PROJ/env?teamId=$TEAM" \
  | python3 -c "
import json,sys
d=json.load(sys.stdin)
secrets=['AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','DATABASE_URL','SENTRY_AUTH_TOKEN','KCOMWEL_API_SERVICE_KEY','NTS_API_SERVICE_KEY','SLACK_WEBHOOK_URL','CRON_SECRET']
for e in d.get('envs',[]):
    if e.get('key') in secrets:
        print(f\"  {e['key']:30} type={e['type']:10} id={e['id']}\")"
```

### Step 1: PATCH로 type in-place 승격 시도 ⚠️ 미검증

Vercel API가 `PATCH`로 type 변경을 허용하는지 모름. **DATABASE_URL 1개로 먼저 시도** → 성공하면 나머지 7개 일괄, 실패하면 Step 2(rm/add)로.

```bash
# DATABASE_URL의 env id 조회 (preview target만)
ENV_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v10/projects/$PROJ/env?teamId=$TEAM" \
  | python3 -c "
import json,sys
d=json.load(sys.stdin)
for e in d.get('envs',[]):
    if e.get('key')=='DATABASE_URL' and 'preview' in e.get('target',[]):
        print(e['id']); break")
echo "Test target env id: $ENV_ID"

# PATCH 시도
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://api.vercel.com/v9/projects/$PROJ/env/$ENV_ID?teamId=$TEAM" \
  -d '{"type":"sensitive"}' | python3 -m json.tool
```

**판정**:

- 응답에 `type: "sensitive"`로 변경됐으면 → ✅ Step 1b로
- 에러("type cannot be changed" 등) → ❌ Step 2로

### Step 1b: 나머지 7개 일괄 PATCH (성공 시)

```bash
for key in AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY DATABASE_URL SENTRY_AUTH_TOKEN KCOMWEL_API_SERVICE_KEY NTS_API_SERVICE_KEY SLACK_WEBHOOK_URL CRON_SECRET; do
  ids=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "https://api.vercel.com/v10/projects/$PROJ/env?teamId=$TEAM" \
    | python3 -c "
import json,sys
d=json.load(sys.stdin)
for e in d.get('envs',[]):
    if e.get('key')=='$key' and e.get('type')=='encrypted': print(e['id'])")
  for id in $ids; do
    res=$(curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
      "https://api.vercel.com/v9/projects/$PROJ/env/$id?teamId=$TEAM" \
      -d '{"type":"sensitive"}')
    new_type=$(echo "$res" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('type','ERR:'+str(d.get('error',{}).get('message',d))))")
    echo "  $key/$id -> $new_type"
  done
done
```

### Step 2: PATCH 실패 시 우회 — 격리 디렉토리 link → env pull → API rm/add

`vercel env pull`은 평문 값을 `.env` 파일로 내려받음 (decrypt API와 다른 경로). 단, **morton 레포에 link 금지** ([feedback_vercel_scope_isolation](../../../.claude/projects/-home-json-homelab-worktrees-main/memory/feedback_vercel_scope_isolation.md)) → `/tmp/vercel-pull-$$/`에 격리 link.

```bash
WORK=$(mktemp -d /tmp/vercel-pull.XXXXXX)
cd "$WORK"
vercel link --yes --project morton-career --scope morton-2262d67a 2>&1 | tail -3

# Production env 평문 다운로드
vercel env pull .env.prod --environment=production 2>&1 | tail -3
vercel env pull .env.preview --environment=preview 2>&1 | tail -3

# 보안: 권한 제한
chmod 600 .env.prod .env.preview
ls -la .env*

# 8개 시크릿 추출 + 검증 (값은 출력하지 않고 길이만)
for key in AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY DATABASE_URL SENTRY_AUTH_TOKEN KCOMWEL_API_SERVICE_KEY NTS_API_SERVICE_KEY SLACK_WEBHOOK_URL CRON_SECRET; do
  v=$(grep "^$key=" .env.prod | cut -d= -f2-)
  echo "$key: len=${#v}"
done
```

그 다음 API로 일괄 rm + sensitive add:

```bash
# 각 시크릿마다: 기존 env id 조회 → DELETE → POST(sensitive 타입)
for key in AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY DATABASE_URL SENTRY_AUTH_TOKEN KCOMWEL_API_SERVICE_KEY NTS_API_SERVICE_KEY SLACK_WEBHOOK_URL CRON_SECRET; do
  # production
  v_prod=$(grep "^$key=" "$WORK/.env.prod" | cut -d= -f2-)
  v_preview=$(grep "^$key=" "$WORK/.env.preview" | cut -d= -f2-)

  # 기존 ID 모두 조회
  ids=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "https://api.vercel.com/v10/projects/$PROJ/env?teamId=$TEAM" \
    | python3 -c "
import json,sys
d=json.load(sys.stdin)
for e in d.get('envs',[]):
    if e.get('key')=='$key' and e.get('type')=='encrypted': print(e['id'])")

  # 모두 삭제
  for id in $ids; do
    curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
      "https://api.vercel.com/v9/projects/$PROJ/env/$id?teamId=$TEAM" > /dev/null
  done

  # sensitive로 신규 추가 (target 분리: production-only인 SLACK_WEBHOOK_URL/CRON_SECRET 주의)
  if [ "$key" = "SLACK_WEBHOOK_URL" ] || [ "$key" = "CRON_SECRET" ]; then
    targets='["production"]'
    value="$v_prod"
  else
    targets='["preview","production"]'
    value="$v_prod"  # preview/prod 값이 동일하다고 가정. 다르면 두 번 등록
    if [ "$v_prod" != "$v_preview" ]; then
      echo "  ⚠️  $key: prod/preview 값 다름. 별도 처리 필요" >&2
    fi
  fi

  curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    "https://api.vercel.com/v10/projects/$PROJ/env?teamId=$TEAM" \
    -d "$(python3 -c "
import json
print(json.dumps({'key':'$key','value':'''$value''','type':'sensitive','target':$targets}))
")" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'  $key -> {d.get(\"type\",d.get(\"error\",d))}')"
done

# **반드시** 끝나면 평문 파일 + link 정리
cd / && rm -rf "$WORK"
echo "cleanup done"
```

### Step 3: 검증

```bash
# 모든 8개가 sensitive로 바뀌었는지 확인
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v10/projects/$PROJ/env?teamId=$TEAM" \
  | python3 -c "
import json,sys
d=json.load(sys.stdin)
secrets=['AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','DATABASE_URL','SENTRY_AUTH_TOKEN','KCOMWEL_API_SERVICE_KEY','NTS_API_SERVICE_KEY','SLACK_WEBHOOK_URL','CRON_SECRET']
ok=fail=0
for e in d.get('envs',[]):
    if e.get('key') in secrets:
        marker='✅' if e['type']=='sensitive' else '❌'
        print(f\"  {marker} {e['key']:30} {e['type']:10} target={','.join(e.get('target',[]))}\")
        if e['type']=='sensitive': ok+=1
        else: fail+=1
print(f'\\n  total: {ok} ok, {fail} fail')"
```

Step 2를 거쳤으면 → **prod 재배포 필요** (rm/add 시 deployment에 새 env 적용 안 될 수 있음):

```bash
DEPLOY=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=$PROJ&teamId=$TEAM&target=production&limit=1" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['deployments'][0]['uid'])")
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://api.vercel.com/v13/deployments?teamId=$TEAM&forceNew=1" \
  -d "{\"name\":\"$PROJ\",\"deploymentId\":\"$DEPLOY\",\"target\":\"production\"}" | head -3
```

PATCH(Step 1b)만 했다면 재배포 불필요 (값 안 바뀌었으므로).

### Step 4: AWS CloudTrail audit (병행 가능)

```bash
# MFA 세션 확인 (만료시 재발급)
aws sts get-caller-identity --profile morton-mfa 2>&1

# 만료면 새 OTP로 재발급 (8h):
# aws sts get-session-token --serial-number arn:aws:iam::214572253021:mfa/CTO-cli \
#   --token-code <OTP> --profile morton --duration-seconds 28800
# 그 결과를 ~/.aws/credentials [morton-mfa]에 aws configure set으로 저장

# 앱 전용 user의 AKID 조회
APP_AKID=$(aws iam list-access-keys --user-name morton-app-storage-user --profile morton-mfa \
  --query 'AccessKeyMetadata[0].AccessKeyId' --output text)
echo "AKID: $APP_AKID"

# CloudTrail lookup (region 명시 필수, ap-northeast-2 + us-east-1 둘 다)
for region in ap-northeast-2 us-east-1; do
  echo "=== region=$region ==="
  aws cloudtrail lookup-events \
    --lookup-attributes "AttributeKey=AccessKeyId,AttributeValue=$APP_AKID" \
    --start-time 2026-04-01 --end-time 2026-04-20 \
    --region $region --profile morton-mfa --max-results 50 \
    --query 'Events[].[EventTime,EventName,SourceIPAddress]' --output table
done
```

**판정**:

- IP가 모두 익숙한 대역(Vercel ASN, 본인 IP, 한국 ISP) → ✅ 깨끗
- 모르는 IP/ASN(특히 미국 데이터센터, Tor exit node 등) → 🚨 침해 의심 → 즉시 키 회전 (full rotation 모드 전환, 풀 회전 계획서 참조)

### Step 5: 정리

```bash
# /tmp 격리 디렉토리 정리 (Step 2 사용했다면)
rm -rf /tmp/vercel-pull.*

# 메모리 업데이트 — Morton 세션의 메모리 디렉토리에 추가:
# /home/json/.claude/projects/-home-json-morton-worktrees-main/memory/MEMORY.md (없으면 생성)에
# project_morton_secrets_sensitive.md 추가:
#   "morton-career의 8개 시크릿 모두 sensitive 타입 마이그레이션 완료 (2026-04-20).
#    이후 신규 시크릿 추가 시 반드시 --sensitive 플래그 사용."
```

## 절대 금지

- ❌ `vercel link`를 morton 레포 어느 디렉토리에서든 직접 실행 — Step 2의 `/tmp/` 격리 디렉토리에서만 허용
- ❌ `.env.prod` 같은 평문 파일을 작업 디렉토리에 남기기 — Step 2 끝나면 즉시 삭제
- ❌ AWS 키 회전 시작 (Step 1~3는 값 변경 X. CloudTrail에 침해 흔적 발견 시에만 회전 모드 전환)
- ❌ morton-plan, sme-tour, amang-web 건드리기 — 이번 작업은 morton-career 한정
- ❌ AKID/시크릿 값을 이 문서나 코드에 하드코딩 — 시크릿 검사 훅이 차단함

## 참고

- 풀 회전 계획서 (이번엔 미실행): [`docs/plans/2026-04-20-morton-career-secret-rotation.md`](./2026-04-20-morton-career-secret-rotation.md)
- Vercel scope 격리 규칙: [feedback_vercel_scope_isolation.md](../../../.claude/projects/-home-json-homelab-worktrees-main/memory/feedback_vercel_scope_isolation.md)
- Vercel 게시판 원문: https://vercel.com/kb/bulletin/vercel-april-2026-security-incident

## 보고 형식

작업 완료 시 다음 형식으로 보고:

```
- Step 1 PATCH: ✅/❌ (실패 사유)
- Step 2 우회 사용: yes/no
- Step 3 검증: 8/8 sensitive 전환 / 부분 실패 시 어느 키
- Step 4 CloudTrail: 정상 / 의심 IP 발견 시 정보
- 정리 완료: /tmp 디렉토리 삭제 yes/no
- 다음 액션 추천 (선택)
```
