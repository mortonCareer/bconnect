# 브랜치 생성

새 작업을 위한 브랜치를 생성합니다.

## 브랜치 네이밍 규칙

`.husky/pre-push` 참조. 허용되는 브랜치명:

- `main`
- `feat/*` - 새 기능
- `fix/*` - 버그 수정
- `docs/*` - 문서 변경
- `chore/*` - 기타 작업
- `refactor/*` - 리팩토링

## 실행

1. 현재 브랜치 확인 (`git branch --show-current`)
2. main 브랜치가 아니면 main으로 이동할지 확인
3. main에서 최신 변경사항 pull (`git pull origin main`)
4. $ARGUMENTS를 기반으로 브랜치명 생성
   - 인자가 없으면 작업 내용 질문
   - 인자에서 적절한 prefix 결정 (feat/, fix/ 등)
   - kebab-case로 변환
5. `git checkout -b 브랜치명` 실행

## 예시

```
/branch 로그인 기능 추가
→ feat/add-login

/branch 버튼 클릭 안됨
→ fix/button-click

/branch CI 파이프라인 개선
→ chore/improve-ci
```
