# Issue 생성

GitHub Issue를 생성합니다.

## 사용법

```
/issue [이슈 내용 설명]
```

## 규칙

### 담당자 지정

- **백엔드 관련** (API, DB): `fine-pine` 할당
- **프론트엔드/인프라 관련** (UI, 컴포넌트, 페이지, Terraform): `manamana32321` 할당

### 레이블 지정

내용에 따라 적절한 레이블 선택:

- `bug`: 버그 리포트
- `enhancement`: 기능 요청/개선
- `documentation`: 문서 작업
- `question`: 질문/논의 필요

### Issue 본문 형식

`.github/ISSUE_TEMPLATE/` 참조:

- 버그: `bug_report.md` 템플릿 사용
- 기능 요청: `feature_request.md` 템플릿 사용

## 실행

1. 사용자 입력 분석 (백엔드/프론트엔드/인프라 구분)
2. 적절한 레이블 및 담당자 결정
3. `gh issue create` 실행 (--assignee, --label 옵션 포함)
