---
name: create-pr
description: GitHub Issue 정보를 기반으로 Pull Request를 생성합니다.
---

# create-pr

GitHub Issue 정보를 기반으로 Pull Request를 생성합니다.

```bash
gh pr create --draft --base dev --title <제목> --body-file <파일>
```

## 가이드

- 변경사항을 dev에 머지합니다
- 비개발자도 읽을 수 있도록 작성합니다
- 파일에 대한 참조는 GitHub Blob 절대 경로로 참조합니다

### UI 스크린샷

- 컴포넌트 Variant × State 마다 스크린샷 + 한줄 설명을 작성하세요
- 스크린샷 파일을 스크래치 패드에 저장하세요
- PR 본문에 주석으로 로컬 파일 경로를 명시하세요 (사용자 직접 첨부)

## PR 생성 프로세스

1. 현재 브랜치에서 이슈 번호 추출
2. 이슈 정보 조회
3. origin/dev와의 변경 사항 분석
4. PR 파일 생성
5. PR 생성

## 참고 문서

- [개발 프로세스](../../../docs/how-to/development.md)
- [배포 프로세스](../../../docs/how-to/deployment.md)
