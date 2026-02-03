---
name: notion-task-sync
description: Notion 보드와 Git 작업 동기화. 이슈 생성→Todo, 브랜치 생성→In Progress, PR 생성→QA, PR 머지→Done
allowed-tools: Bash, Read, Write, Grep
---

# Notion Task Sync

Notion 보드와 GitHub 작업을 자동으로 동기화합니다.

⚠️ **현재 상태**: 문서만 작성됨 (구현 보류)

---

## 기능 개요

Git 작업의 각 단계에서 Notion 보드 상태를 자동으로 업데이트합니다:

```
GitHub Issue 생성
    ↓
Notion: 새 카드 생성 (Todo)
    ↓
브랜치 생성
    ↓
Notion: 상태 → In Progress
    ↓
PR 생성
    ↓
Notion: 상태 → QA
    ↓
PR 머지
    ↓
Notion: 상태 → Done
```

---

## Notion 보드 구조

### 데이터베이스 속성

| 속성         | 타입         | 설명                        |
| ------------ | ------------ | --------------------------- |
| Name         | Title        | 작업 제목 (이슈 제목)       |
| Status       | Select       | Todo, In Progress, QA, Done |
| GitHub Issue | URL          | 이슈 링크                   |
| GitHub PR    | URL          | PR 링크                     |
| Assignee     | Person       | 담당자                      |
| Type         | Multi-select | FE, BE, api-spec 등         |
| Priority     | Select       | High, Medium, Low           |
| Created      | Created time | 생성 시간                   |
| Updated      | Last edited  | 마지막 업데이트             |

### 상태 정의

| 상태        | 설명            | 트리거      |
| ----------- | --------------- | ----------- |
| Todo        | 작업 대기 중    | Issue 생성  |
| In Progress | 작업 진행 중    | 브랜치 생성 |
| QA          | QA 대기/진행 중 | PR 생성     |
| Done        | 완료            | PR 머지     |

---

## Notion API 설정

### 1. Notion Integration 생성

1. [Notion Integrations](https://www.notion.so/my-integrations) 접속
2. "New integration" 클릭
3. 정보 입력:
   - Name: `Morton GitHub Sync`
   - Associated workspace: 팀 워크스페이스 선택
   - Capabilities: Read content, Update content, Insert content

4. "Submit" 클릭
5. **Internal Integration Token** 복사 (시크릿으로 관리)

### 2. 데이터베이스에 Integration 연결

1. Notion에서 작업 보드 데이터베이스 열기
2. 우측 상단 `...` → "Connections" → "Add connection"
3. "Morton GitHub Sync" 선택

### 3. Database ID 확인

데이터베이스 URL에서 ID 추출:

```
https://www.notion.so/<workspace>/<database-id>?v=<view-id>
                                  ^^^^^^^^^^^^^^^^
```

예시:

```
https://www.notion.so/morton-so/abc123def456?v=xyz789
Database ID: abc123def456
```

---

## 환경 변수 설정

```bash
# .env (로컬)
NOTION_API_TOKEN=secret_xxxxxxxxxxxxx
NOTION_DATABASE_ID=abc123def456

# Vercel/Railway (프로덕션)
# 각 플랫폼 대시보드에서 환경 변수 추가
```

---

## 동기화 흐름

### 1. Issue 생성 → Notion Todo

**트리거**: `issue-management` 스킬 실행 후

**Notion API 호출**:

```typescript
await notion.pages.create({
  parent: { database_id: process.env.NOTION_DATABASE_ID },
  properties: {
    Name: {
      title: [{ text: { content: issueTitle } }],
    },
    Status: {
      select: { name: 'Todo' },
    },
    'GitHub Issue': {
      url: `https://github.com/org/repo/issues/${issueNumber}`,
    },
    Assignee: {
      people: [{ id: notionUserId }],
    },
    Type: {
      multi_select: issueLabels.map((label) => ({ name: label })),
    },
  },
})
```

### 2. 브랜치 생성 → In Progress

**트리거**: `worktree-manager` 스킬 실행 후

**Notion API 호출**:

```typescript
// 이슈 번호로 Notion 페이지 검색
const page = await findPageByIssueNumber(issueNumber)

// 상태 업데이트
await notion.pages.update({
  page_id: page.id,
  properties: {
    Status: {
      select: { name: 'In Progress' },
    },
  },
})
```

### 3. PR 생성 → QA

**트리거**: `pr-from-issue` 스킬 실행 후

**Notion API 호출**:

```typescript
const page = await findPageByIssueNumber(issueNumber)

await notion.pages.update({
  page_id: page.id,
  properties: {
    Status: {
      select: { name: 'QA' },
    },
    'GitHub PR': {
      url: `https://github.com/org/repo/pull/${prNumber}`,
    },
  },
})
```

### 4. PR 머지 → Done

**트리거**: GitHub Actions (PR merge webhook)

**Notion API 호출**:

```typescript
const page = await findPageByPRNumber(prNumber)

await notion.pages.update({
  page_id: page.id,
  properties: {
    Status: {
      select: { name: 'Done' },
    },
  },
})
```

---

## 구현 계획

### Phase 1: Notion API 클라이언트

```typescript
// lib/notion.ts
import { Client } from '@notionhq/client'

export const notion = new Client({
  auth: process.env.NOTION_API_TOKEN,
})

export async function findPageByIssueNumber(issueNumber: number) {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      property: 'GitHub Issue',
      url: {
        contains: `/issues/${issueNumber}`,
      },
    },
  })

  return response.results[0]
}

export async function createTaskFromIssue(issue: GitHubIssue) {
  return await notion.pages.create({
    // ... (위 예시 참조)
  })
}

export async function updateTaskStatus(pageId: string, status: string) {
  return await notion.pages.update({
    page_id: pageId,
    properties: {
      Status: { select: { name: status } },
    },
  })
}
```

### Phase 2: Git Hook 통합

```bash
# .git/hooks/post-checkout (브랜치 생성 시)
#!/bin/bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [[ $BRANCH =~ ^(feat|fix)/([0-9]+) ]]; then
  ISSUE=${BASH_REMATCH[2]}
  node scripts/notion-sync.js update-status $ISSUE "In Progress"
fi
```

### Phase 3: GitHub Actions 연동

```yaml
# .github/workflows/notion-sync.yml
name: Notion Sync

on:
  issues:
    types: [opened]
  pull_request:
    types: [opened, closed]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Sync to Notion
        env:
          NOTION_API_TOKEN: ${{ secrets.NOTION_API_TOKEN }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
        run: |
          node scripts/notion-sync.js ${{ github.event_name }}
```

---

## 사용 예시 (구현 후)

### 수동 동기화

```bash
# 이슈를 Notion에 추가
notion-sync create-task 123

# 상태 업데이트
notion-sync update-status 123 "In Progress"

# PR 링크 추가
notion-sync link-pr 123 456
```

### 자동 동기화

Git 작업 시 자동으로 실행:

```bash
# 이슈 생성 → Notion Todo 자동 생성
gh issue create --title "Add feature"

# 브랜치 생성 → Notion In Progress
git checkout -b feat/123-add-feature

# PR 생성 → Notion QA
gh pr create

# PR 머지 → Notion Done
gh pr merge 123 --squash
```

---

## 보안 고려사항

### API 토큰 관리

- ❌ 코드에 하드코딩 금지
- ❌ `.env` 파일 커밋 금지
- ✅ 환경 변수로만 관리
- ✅ GitHub Actions Secrets 사용

### 권한 최소화

Notion Integration 권한:

- ✅ Read content (데이터 조회)
- ✅ Update content (상태 업데이트)
- ✅ Insert content (새 카드 생성)
- ❌ Delete content (불필요)

---

## 문제 해결

### Notion API 에러

```bash
# 토큰 확인
curl https://api.notion.com/v1/users/me \
  -H "Authorization: Bearer $NOTION_API_TOKEN" \
  -H "Notion-Version: 2022-06-28"

# 데이터베이스 접근 확인
curl https://api.notion.com/v1/databases/$NOTION_DATABASE_ID \
  -H "Authorization: Bearer $NOTION_API_TOKEN" \
  -H "Notion-Version: 2022-06-28"
```

### Integration 연결 안 됨

1. Notion 데이터베이스 페이지에서 Integration 연결 확인
2. Integration 권한 확인 (Read, Update, Insert)
3. 데이터베이스 ID 확인

---

## 향후 개선 사항

- [ ] 양방향 동기화 (Notion → GitHub)
- [ ] 우선순위 자동 할당
- [ ] 예상 완료 시간 추적
- [ ] 작업 시간 로깅
- [ ] Slack 알림 통합
- [ ] 주간 리포트 자동 생성

---

## 관련 문서

- [Notion API Documentation](https://developers.notion.com/)
- [Git Workflow](../../../docs/GIT_WORKFLOW.md)
- [Issue Management](../issue-management/SKILL.md)

---

## 주의사항

⚠️ **현재 이 스킬은 문서만 작성된 상태입니다.**

구현을 위해 필요한 것:

1. Notion Integration 생성 및 설정
2. 데이터베이스 구조 생성
3. API 클라이언트 구현
4. Git hooks/GitHub Actions 연동
5. 에러 핸들링 및 재시도 로직

구현 예정 시기: TBD (팀 논의 필요)
