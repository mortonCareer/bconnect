# Figma Webhook 설정 가이드

디자이너가 Figma에서 버전 저장 시 자동으로 린트가 실행되도록 Webhook을 설정합니다.

## 1. 필요한 시크릿 설정

GitHub Repository > Settings > Secrets and variables > Actions에서 추가:

| 이름 | 설명 |
|------|------|
| `FIGMA_ACCESS_TOKEN` | Figma Personal Access Token |
| `SLACK_WEBHOOK_URL` (선택) | Slack Incoming Webhook URL |

### Figma Access Token 생성

1. Figma > Settings > Account > Personal access tokens
2. "Generate new token" 클릭
3. 토큰 복사 후 GitHub Secrets에 추가

## 2. Figma Webhook 등록

Figma API를 통해 Webhook을 등록합니다.

```bash
# GitHub Personal Access Token (repo 권한 필요)
GITHUB_TOKEN="ghp_xxxx"

# Figma 팀 ID (Figma URL에서 확인: figma.com/files/team/{TEAM_ID}/...)
FIGMA_TEAM_ID="your_team_id"

# Figma Access Token
FIGMA_ACCESS_TOKEN="your_figma_token"

# Webhook 등록
curl -X POST "https://api.figma.com/v2/webhooks" \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "FILE_VERSION_UPDATE",
    "team_id": "'$FIGMA_TEAM_ID'",
    "endpoint": "https://api.github.com/repos/YOUR_ORG/morton/dispatches",
    "passcode": "'$GITHUB_TOKEN'",
    "description": "Figma Lint CI"
  }'
```

## 3. Webhook 중계 서버 (필요 시)

Figma Webhook 페이로드를 GitHub `repository_dispatch` 형식으로 변환해야 합니다.

### Option A: Cloudflare Worker (무료)

```javascript
// worker.js
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const payload = await request.json();

    // FILE_VERSION_UPDATE 이벤트만 처리
    if (payload.event_type !== 'FILE_VERSION_UPDATE') {
      return new Response('Ignored', { status: 200 });
    }

    // GitHub repository_dispatch 트리거
    const response = await fetch(
      `https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'figma-version-update',
          client_payload: {
            file_key: payload.file_key,
            file_name: payload.file_name,
            version_id: payload.version_id,
            triggered_by: payload.triggered_by,
          },
        }),
      }
    );

    return new Response('OK', { status: 200 });
  },
};
```

### Option B: AWS Lambda

Lambda 함수로 동일한 로직 구현 가능.

## 4. 수동 테스트

GitHub Actions > figma-lint > Run workflow에서 Figma URL 입력 후 테스트:

```
https://www.figma.com/design/YOUR_FILE_KEY/파일이름?node-id=...
```

## 5. 워크플로우 동작

```
디자이너: Figma에서 버전 저장 (Cmd+Option+S)
    ↓
Figma Webhook: FILE_VERSION_UPDATE 이벤트 발생
    ↓
중계 서버: GitHub repository_dispatch 트리거
    ↓
GitHub Action: figma-lint.yml 실행
    ↓
결과: Slack 알림 / GitHub Issue 생성 (에러 시)
```

## 린트 검사 항목

| 항목 | 레벨 | 설명 |
|------|------|------|
| 로컬 스타일 사용 | warning | Variables 사용 권장 |
| 페이지 이름 컨벤션 | warning | `{기능}/{상태}` 형식 |
| 컴포넌트 사용 | info | 컴포넌트 개수 표시 |

## 트러블슈팅

### Webhook이 트리거되지 않음

1. Figma Webhook 상태 확인:
   ```bash
   curl -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" \
     "https://api.figma.com/v2/webhooks"
   ```

2. 버전 저장인지 확인 (일반 저장은 FILE_UPDATE)

### GitHub Action이 실행되지 않음

1. `repository_dispatch` 이벤트 권한 확인
2. GitHub Token에 `repo` 권한 있는지 확인