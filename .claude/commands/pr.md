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

1. **기존 PR 확인**: `gh pr list --head <현재브랜치>` 실행
   - PR이 이미 존재하면 → `gh pr view`로 기존 내용 확인 후 `gh pr edit`로 업데이트
   - PR이 없으면 → 새로 생성
2. `git diff main...HEAD`로 변경 파일 분석
3. 백엔드 관련 파일 포함 여부 확인
4. 적절한 레이블 결정
5. `gh pr create` 또는 `gh pr edit` 실행 (--reviewer, --label 옵션 포함)
