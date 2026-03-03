#!/usr/bin/env bash
set -euo pipefail

# Railway 배포 트리거 설정 스크립트
# Terraform local-exec provisioner에서 호출
#
# 필수 환경변수:
#   RAILWAY_TOKEN, SERVICE_ID, PROJECT_ID, ENVIRONMENT_ID

API_URL="https://backboard.railway.app/graphql/v2"

gql() {
  local response
  response=$(curl -sf "$API_URL" \
    -H "Authorization: Bearer $RAILWAY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$1")

  if echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if 'errors' not in d else 1)" 2>/dev/null; then
    echo "$response"
  else
    echo "GraphQL error:" >&2
    echo "$response" | python3 -m json.tool >&2
    return 1
  fi
}

# 1. 배포 트리거 ID 조회
echo "Fetching deployment trigger for service $SERVICE_ID..."

TRIGGER_RESPONSE=$(gql "$(cat <<EOF
{
  "query": "query { deploymentTriggers(projectId: \"$PROJECT_ID\", environmentId: \"$ENVIRONMENT_ID\", serviceId: \"$SERVICE_ID\") { edges { node { id branch checkSuites } } } }"
}
EOF
)")

TRIGGER_ID=$(echo "$TRIGGER_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
edges = data['data']['deploymentTriggers']['edges']
if not edges:
    print('ERROR: No deployment trigger found', file=sys.stderr)
    sys.exit(1)
print(edges[0]['node']['id'])
")

CURRENT_CHECK_SUITES=$(echo "$TRIGGER_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(str(data['data']['deploymentTriggers']['edges'][0]['node']['checkSuites']).lower())
")

echo "Trigger ID: $TRIGGER_ID"
echo "Current checkSuites: $CURRENT_CHECK_SUITES"

# 2. checkSuites 활성화
if [ "$CURRENT_CHECK_SUITES" = "true" ]; then
  echo "checkSuites already enabled. No changes needed."
else
  echo "Enabling checkSuites (Wait for CI)..."

  gql "$(cat <<EOF
{
  "query": "mutation { deploymentTriggerUpdate(id: \"$TRIGGER_ID\", input: { checkSuites: true }) { id checkSuites } }"
}
EOF
)" > /dev/null

  echo "checkSuites enabled successfully."
fi
