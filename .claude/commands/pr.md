# PR 생성

현재 브랜치의 변경사항을 분석하여 Pull Request를 생성합니다.

## 규칙

### 리뷰어 지정

- **백엔드 관련 변경** (`apps/api/`): `fine-pine` 리뷰어 추가
- 프론트엔드/인프라만 변경: 리뷰어 없음

### 레이블 지정

변경 내용에 따라 적절한 레이블 선택:

- `enhancement`: 새로운 기능 추가
- `bug`: 버그 수정
- `documentation`: 문서 변경

### PR 본문 형식

`.github/pull_request_template.md` 참조

## 실행

1. `git diff main...HEAD`로 변경 파일 분석
2. 백엔드 관련 파일 포함 여부 확인
3. 적절한 레이블 결정
4. `gh pr create` 실행 (--reviewer, --label 옵션 포함)
