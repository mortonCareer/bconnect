---
name: figma-sync
description: Figma와 코드베이스 동기화. 디자인 변경 감지, 컴포넌트 자동 업데이트, 디자인 토큰 동기화
allowed-tools: Bash, Read, Write, Grep
---

# Figma Sync

Figma 디자인 변경사항을 감지하고 코드베이스와 자동으로 동기화합니다.

## 사용 시점

- 디자인 시안 업데이트 시
- 디자인 토큰 변경 시
- 컴포넌트 스타일 수정 시

---

## 기능

### 1. 디자인 변경 감지

Figma Webhooks 또는 주기적 폴링으로 변경사항을 감지합니다.

**Figma Webhooks:**

```json
POST https://your-api.com/webhooks/figma

{
  "event_type": "FILE_UPDATE",
  "file_key": "ABC123",
  "file_name": "Design System",
  "timestamp": "2024-01-25T10:30:00Z",
  "triggered_by": {
    "id": "123456",
    "handle": "designer@example.com"
  }
}
```

**폴링 방식:**

```bash
# 정기적으로 Figma API 호출
# 마지막 업데이트 시간 비교

GET /v1/files/:file_key
Response:
{
  "lastModified": "2024-01-25T10:30:00Z",
  "version": "1234567890"
}
```

### 2. 변경사항 분석

어떤 부분이 변경되었는지 분석합니다.

**감지 항목:**

| 변경 유형          | 동기화 대상           |
| ------------------ | --------------------- |
| Color Styles       | Tailwind colors       |
| Text Styles        | Typography 설정       |
| Component Variants | CVA variants          |
| Spacing Values     | Tailwind spacing      |
| Border Radius      | Tailwind borderRadius |

**diff 예시:**

```json
{
  "changes": [
    {
      "type": "COLOR_STYLE",
      "name": "Primary/500",
      "old": "#3B82F6",
      "new": "#2563EB",
      "affected_components": ["Button", "Link", "Badge"]
    },
    {
      "type": "TEXT_STYLE",
      "name": "Heading/H1",
      "changes": {
        "fontSize": { "old": "36px", "new": "40px" },
        "lineHeight": { "old": "1.2", "new": "1.25" }
      }
    }
  ]
}
```

### 3. 코드 자동 업데이트

변경사항을 코드에 자동 반영합니다.

**디자인 토큰 업데이트:**

```typescript
// design-tokens.ts (Before)
export const colors = {
  primary: {
    500: '#3B82F6',
  },
}

// design-tokens.ts (After - 자동 업데이트)
export const colors = {
  primary: {
    500: '#2563EB', // Updated from Figma
  },
}
```

**Tailwind 설정 업데이트:**

```javascript
// tailwind.config.ts
import { colors } from './design-tokens'

export default {
  theme: {
    extend: {
      colors, // 자동으로 최신 값 반영
    },
  },
}
```

### 4. 컴포넌트 재생성

컴포넌트 구조가 변경된 경우 코드를 재생성합니다.

**트리거:**

- Figma Component Variants 추가/삭제
- Auto Layout 구조 변경
- Properties 추가/변경

**재생성 프로세스:**

```
Figma 변경 감지
    ↓
기존 컴포넌트 백업
    ↓
새 컴포넌트 코드 생성
    ↓
Props 타입 비교 (Breaking Change 체크)
    ↓
Breaking Change 있으면 → 경고 + 수동 확인 요청
Breaking Change 없으면 → 자동 업데이트
    ↓
PR 자동 생성
```

---

## 동기화 흐름

### 자동 동기화 (Webhooks)

```
Figma 디자인 변경 (디자이너)
    ↓
Figma Webhook → GitHub Actions 트리거
    ↓
변경사항 분석
    ↓
디자인 토큰 업데이트
    ↓
Breaking Change 체크
    ↓
자동 커밋 + PR 생성
    ↓
CTO 리뷰
    ↓
PR 머지 → 프로덕션 배포
```

### 수동 동기화

```bash
# 명령어 실행
figma-sync --file ABC123 --auto-commit

# 프로세스
1. Figma API에서 최신 데이터 가져오기
2. 로컬 design-tokens.ts와 비교
3. 변경사항 적용
4. git commit -m "chore: sync design tokens from Figma"
5. git push
```

---

## GitHub Actions 설정

```yaml
# .github/workflows/figma-sync.yml
name: Figma Sync

on:
  # Webhook으로 트리거 (향후)
  repository_dispatch:
    types: [figma-update]

  # 수동 실행
  workflow_dispatch:

  # 정기 실행 (매일 오전 9시)
  schedule:
    - cron: '0 0 * * *'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Run Figma Sync
        env:
          FIGMA_ACCESS_TOKEN: ${{ secrets.FIGMA_ACCESS_TOKEN }}
        run: node scripts/figma-sync.js

      - name: Check for changes
        id: changes
        run: |
          if [[ -n $(git status --porcelain) ]]; then
            echo "has_changes=true" >> $GITHUB_OUTPUT
          fi

      - name: Create PR
        if: steps.changes.outputs.has_changes == 'true'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          BRANCH="figma-sync-$(date +%Y%m%d-%H%M%S)"
          git checkout -b "$BRANCH"
          git add .
          git commit -m "chore: sync design tokens from Figma"
          git push origin "$BRANCH"

          gh pr create \
            --title "chore: Sync design tokens from Figma" \
            --body "$(cat <<EOF
## Summary

Figma 디자인 토큰 자동 동기화

## Changes

- 디자인 토큰 업데이트
- Tailwind 설정 반영

## Review Checklist

- [ ] 색상 변경 확인
- [ ] Typography 변경 확인
- [ ] Breaking Change 없음 확인

> This PR was automatically created by Figma Sync
EOF
)" \
            --reviewer <CTO_GITHUB> \
            --label "chore"
```

---

## Breaking Change 감지

컴포넌트 API 변경을 자동으로 감지합니다.

**감지 케이스:**

```typescript
// Before
interface ButtonProps {
  variant: 'primary' | 'secondary'
  size: 'sm' | 'md'
}

// After (Breaking Change!)
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' // ✅ 추가는 OK
  size: 'xs' | 'sm' | 'md' // ⚠️ 'xs' 추가
  // color: 'blue' | 'red'  // ❌ 새 필수 prop 추가 (Breaking!)
}
```

**알림:**

```markdown
⚠️ Breaking Change Detected

The following changes may break existing code:

1. Button component
   - Removed variant: 'ghost'
   - This variant is used in 12 locations

Action required:

- [ ] Update all Button instances
- [ ] Run `grep -r "variant=\"ghost\"" apps/`
```

---

## 동기화 대상 파일

### 1. 디자인 토큰

```
packages/config/design-tokens/
├── colors.ts          # Color Styles → Tailwind colors
├── typography.ts      # Text Styles → font sizes, weights
├── spacing.ts         # Spacing → Tailwind spacing
├── borderRadius.ts    # Border radius → Tailwind rounded
└── shadows.ts         # Effects → Tailwind shadows
```

### 2. Tailwind 설정

```javascript
// tailwind.config.ts
import * as tokens from './packages/config/design-tokens'

export default {
  theme: {
    extend: {
      colors: tokens.colors,
      fontSize: tokens.typography.fontSize,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
    },
  },
}
```

### 3. 컴포넌트 (선택)

```
packages/ui/components/ui/
├── Button.tsx        # Figma: Components/Button
├── Card.tsx          # Figma: Components/Card
└── Badge.tsx         # Figma: Components/Badge
```

---

## 동기화 로그

변경 이력을 자동으로 기록합니다.

```markdown
# CHANGELOG-FIGMA.md

## 2024-01-25

### Changed

- Primary color updated: #3B82F6 → #2563EB
- Heading/H1 font size: 36px → 40px

### Added

- New variant: Button/Outline
- Shadow style: elevation-high

### Affected Components

- Button: Variant 추가
- Card: Shadow 적용
- Link: Color 변경
```

---

## 충돌 해결

코드 수정과 Figma 동기화가 충돌하는 경우:

**우선순위:**

1. **코드 우선**: 수동으로 수정한 코드 유지
2. **Figma 우선**: 디자인 토큰은 Figma가 SSOT

**충돌 감지:**

```bash
# 로컬 변경사항 있음
git status
# modified: packages/config/design-tokens/colors.ts

# Figma Sync 실행 시 경고
⚠️  Conflict detected in design-tokens/colors.ts

    Local changes found. Choose:
    1. Keep local changes
    2. Overwrite with Figma (recommended for design tokens)
    3. Manual merge
```

---

## 주의사항

### DO ✅

- 디자인 토큰은 Figma를 SSOT로 유지
- 정기적으로 동기화 (매일 또는 주간)
- Breaking Change 신중히 리뷰
- 동기화 PR은 CTO가 리뷰

### DON'T ❌

- 디자인 토큰 파일 직접 수정 (Figma에서 수정)
- 동기화 없이 배포
- Breaking Change 자동 머지
- 테스트 없이 컴포넌트 재생성

---

## 문제 해결

### 동기화 실패

```bash
# Figma API 연결 확인
curl https://api.figma.com/v1/me \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN"

# File 접근 권한 확인
curl https://api.figma.com/v1/files/:file_key \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN"
```

### Webhook 설정

1. Figma → Settings → Webhooks
2. Add webhook:
   - Event: `FILE_UPDATE`
   - Endpoint: `https://api.github.com/repos/:owner/:repo/dispatches`
   - Secret: GitHub Personal Access Token

---

## 향후 계획

- [ ] Figma Webhook 정식 연동
- [ ] 실시간 동기화 (변경 즉시 반영)
- [ ] Component 자동 재생성
- [ ] Visual Regression Testing 통합
- [ ] Storybook 자동 업데이트

---

## 참고 문서

- [Figma Webhooks](https://www.figma.com/developers/api#webhooks)
- [GitHub Actions](https://docs.github.com/en/actions)
- [figma-to-component](../figma-to-component/SKILL.md)
