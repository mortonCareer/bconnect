# Git Commit Policy

**IMPORTANT**: Get user approval before committing changes.

## Commit Approval Hook

All `git commit` commands are intercepted by `.claude/hooks/require-commit-approval.py`:

1. Hook analyzes `git status` and `git diff --stat`
2. Shows commit message, changed files, and line statistics
3. Blocks commit and waits for user response
4. On approval, re-run with `COMMIT_APPROVED=1` environment variable

## Approval Keywords

- **Approve**: "yes", "확인", "커밋 승인", "ㅇㅇ", "go"
- **Reject**: "no", "취소", "수정 필요"

## Workflow

```bash
# 1. Attempt commit → hook blocks
git commit -m "feat: add feature"

# 2. User approves → re-run with approval flag
COMMIT_APPROVED=1 git commit -m "feat: add feature"
```

## Pre-commit Hooks (Husky + lint-staged)

Automatically runs on `git commit`:

1. ESLint --fix on `*.{js,jsx,ts,tsx}`
2. Prettier --write on all files
3. Commitlint checks commit message format
