# PR description format

frontend-cycle Phase 10 의 PR description 자세한 가이드. SKILL.md 본문은 lean 하게 유지하고 본 파일을 참조한다.

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
- PR 본문의 스크린샷은 **브라우저 렌더 결과물만** (Figma 스크린샷 X)

## 골격

```text
## Summary
... 1-2 문장

## Changes
- ...

## Test
- [ ] ...

## State coverage
### 데이터 / ### 폼 / ### 인터랙션 / ### 접근성

## Follow-up
...

Closes #<이슈>
```

스크린샷은 별도 Summary inline 섹션 두지 않고, State coverage 의 각 상태 li 안 토글에서만 첨부 (시각 증거 분산 X).

## State coverage 토글 패턴

각 상태별 li 가 한 줄로 보이고, 시각 증거 있는 항목만 자식 `<details>` 토글로 스크린샷 첨부:

```markdown
### 데이터

- [ ] loading — **N/A** 부모 위임
- [x] empty — `tasks=[]` 일 때 헤더만 표시
  <details><summary>📸 스크린샷</summary>

  ![empty](https://github.com/<owner>/<repo>/raw/<sha>/<path>)

  </details>

- [ ] error — **N/A** 부모 위임
- [x] success — 9개 mock task 정상 렌더
  <details><summary>📸 스크린샷</summary>

  ![success](https://github.com/<owner>/<repo>/raw/<sha>/<path>)

  </details>
```

### GitHub markdown 주의사항

- `<details><summary>` 다음 **빈 줄 필수** — markdown 컨텍스트 진입
- image 다음 빈 줄 + `</details>` 별도 줄
- li 본문 continuation 은 **2-space 들여쓰기**, summary/image/`</details>` 모두 같은 들여쓰기
- 들여쓰기 일관성 깨지면 raw HTML 텍스트로 렌더되거나 image 안 보임

## 스크린샷 자동 첨부 (drag-drop 없이)

1. PNG 를 git tracked path 에 commit
   - 예: `apps/<app>/src/.../​__screenshots__/state-name.png`
   - dev-only / production-gate 페이지 옆에 두면 production bundle 영향 X
2. push 후 commit SHA 받음
3. PR body 에 raw URL: `https://github.com/<owner>/<repo>/raw/<sha>/<path>`

**permalink (SHA 기반) 사용** — branch 링크는 squash merge 후 깨짐.

## 스크린샷 캡처 자동화

Playwright CLI (workspace root `./node_modules/.bin/playwright` 에 hoisted):

```bash
./node_modules/.bin/playwright screenshot \
  --viewport-size=1024,800 \
  --wait-for-selector='[data-testid="..."]' \
  --full-page \
  "http://localhost:3001/<route>?<state-param>" \
  apps/.../​__screenshots__/state-name.png
```

`--wait-for-selector` 로 hydration 완료 후 캡처. `google-chrome --headless --virtual-time-budget` 보다 안정적.

여러 상태는 route 에 query param 분기 추가 (예: `?state=empty`) — 한 페이지로 다 캡처.

## 예시

[mortonCareer/bconnect#374](https://github.com/mortonCareer/bconnect/pull/374) — GanttChart 컴포넌트 PR. 본 가이드의 토글 패턴, 자동 첨부 모두 검증된 형태.
