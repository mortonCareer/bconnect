---
name: create-issue
description: GitHub Issue 생성 및 관리. 이슈 템플릿 선택, 레이블 자동 적용
---

# create-issue

GitHub Issue를 생성하고 적절한 레이블을 적용합니다.

```bash
gh issue create --title <제목> --body-file <파일>
```

## 생성 방법

- 본문은 파일로 저장 후 파라미터로 전달한다.
- 레이블은 `gh label list` 로 실측한 후 추천한다.
- 마일스톤은 `gh api repos/{owner}/{repo}/milestones` 로 실측 후 추천한다.

## 참고 문서

- [개발 프로세스](../../../docs/how-to/development.md)
