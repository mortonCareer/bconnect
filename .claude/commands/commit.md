# 커밋 생성

변경사항을 lint/format 후 커밋합니다.

## 실행 순서

1. **Lint 실행**: `pnpm lint` (변경된 앱만)
2. **Format 실행**: `pnpm format`
3. **변경사항 확인**: `git status`, `git diff`
4. **커밋 생성**

## 커밋 메시지 규칙

[Conventional Commits](https://www.conventionalcommits.org/) 준수

### Subject (영문)

```
<type>(<scope>): <description>
```

**Type:**

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 변경

**Scope (선택):**

- `career`, `works`, `api`, `ui`, `config`, `infra` 등

### Body (한글)

```
- 변경 내용 설명
- 왜 변경했는지
- 관련 이슈 번호 (있으면)
```

### 예시

```
feat(career): add Instagram ZIP upload feature

- 인스타그램 데이터 다운로드 ZIP 파일 업로드 기능 추가
- ZIP 파일 파싱 후 미디어 추출하여 포트폴리오에 반영
- Closes #27

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 주의사항

- lint/format 에러 발생 시 커밋 중단
- 변경사항 없으면 커밋하지 않음
- `--no-verify` 사용 금지
