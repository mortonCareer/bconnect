# PR description format

frontend-cycle Phase 10 의 PR description 원칙·패턴. 자세한 골격은 [`.github/pull_request_template.md`](../../../../.github/pull_request_template.md) 참조 — 본 파일은 원칙 + 패턴만 정의.

## 원칙

### 리뷰어 시점

PR body 는 **리뷰어/디자이너/QA가 검수 가능하게** 만드는 문서. 작성자만 아는 내용은 제외:

- 도구 만료 경고 (예: "Figma MCP URL 은 7일 만료") — 리뷰어는 모름
- 로컬 파일 경로 (예: `.tmp/screenshots/...`) — 리뷰어는 접근 불가
- commit 메타 / 작업 history (예: "본 PR 후반 commit 에서 X 제거") — git log / diff 로 확인 가능

작성자가 다음 PR 에서 참고하려는 메모는 PR 본문이 아니라 별도 작성자 노트 (issue / comment / 작업 도구).

### 구현 결과물만 노출

- **Figma 설계 등 입력은 이슈 본문**에 두고 PR 에서는 이슈 링크만
- PR 본문은 "이걸 만들었어요" 노출. 설계 ↔ 구현 비교는 리뷰어가 이슈 ↔ PR cross-reference
- PR 본문의 시각 증거는 **브라우저 렌더 결과물만** (Figma 스크린샷 X)

## State coverage 토글 패턴

각 상태별 li 가 한 줄 + 시각 증거 있는 항목만 자식 `<details><summary>📸 스크린샷</summary>` 토글로 첨부. 카테고리 (`### 데이터` / `### 폼` / `### 인터랙션` / `### 접근성`) 는 PR template `## State coverage` 본문 구조 따름.

## 시각 증거 첨부 방식

PR diff 에 binary commit 금지 (repo 비대·history 오염). 워크플로:

1. 로컬 PNG 캡처 — Playwright 등으로 gitignored 경로 저장 (예: `.tmp/screenshots/state-name.png`)
2. PR body 토글 안에 HTML 주석으로 로컬 경로 명시 + `(첨부 예정)` placeholder 작성
3. 사용자에게 PR UI 에서 drag-drop 첨부 요청 — GitHub UI 에서 해당 PNG 를 placeholder 위치에 첨부 (CDN URL 자동 생성). CLI 자동화 불가.

### 예시 토글 마크업

```markdown
- [x] success — 9개 mock task 정상 렌더
  <details><summary>📸 스크린샷</summary>

  <!-- 사용자: 아래 로컬 PNG 를 GitHub UI 에서 drag-drop 으로 첨부 (CLI 자동화 불가):
       .tmp/screenshots/gantt-success.png -->

  (첨부 예정)

  </details>
```

## 예시

[mortonCareer/bconnect#374](https://github.com/mortonCareer/bconnect/pull/374) — GanttChart 컴포넌트 PR. State coverage 토글 패턴 적용된 형태.
