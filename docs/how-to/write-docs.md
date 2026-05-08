# 문서 작성 룰

> **For**: `docs/` 안에 새 문서를 쓰거나 기존 문서를 정비하는 사람 (인간 또는 AI).
> **You'll be able to**: 새 문서를 어느 카테고리에 두고, 얼마나 길게, 어떤 톤으로 쓸지 결정한다.

이 문서는 Morton 팀의 docs 헌법이다. 새 docs를 쓰기 전 한 번 읽고, 모호할 때 다시 본다.

---

## 1. Diátaxis 4분할

[Diátaxis](https://diataxis.fr)는 docs를 4가지 type으로 분리한다. 각 type은 다른 사용자 의도에 답한다.

| Type            | 사용자 의도                   | 비유      | Morton 예시                                                                                                         |
| --------------- | ----------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| **Tutorial**    | "처음이라 손잡고 배우고 싶다" | 요리 강습 | [`tutorials/ONBOARDING.md`](../tutorials/ONBOARDING.md) (신규 합류자 Day 1)                                         |
| **How-to**      | "X를 어떻게 하지?"            | 레시피    | [`how-to/git-workflow.md`](./git-workflow.md) (이슈 → PR 생성)                                                      |
| **Reference**   | "X의 정확한 정의/규격은?"     | 사전      | [`reference/tools.md`](../reference/tools.md) (외부 도구 SSoT), [`reference/specs/`](../reference/specs/) (OpenAPI) |
| **Explanation** | "왜 이렇게 했지?"             | 백서      | [`explanation/adr/`](../explanation/adr/) (Architecture Decision Records)                                           |

**원칙: 한 문서 = 한 type.** 두 type이 섞이면 사용자가 길을 잃는다 (예: 배포 절차를 읽다가 갑자기 인프라 선택 이유 설명 — How-to 의도였는데 Explanation을 읽게 됨).

---

## 2. 길이 가이드

Diátaxis 자체는 명시적 줄 수 룰을 두지 않는다. 줄 수보다 **분해 신호 휴리스틱**으로 판단:

| Type        | 통념                                | 분해 신호                         |
| ----------- | ----------------------------------- | --------------------------------- |
| Tutorial    | 5-30분 안에 끝낼 수 있는 분량       | 한 튜토리얼에 main goal 둘 이상   |
| How-to      | 한 task = 한 페이지, 보통 100-300줄 | 제목에 "and"/"또는", verb 둘 이상 |
| Reference   | 길이 무관, 구조 우선                | TOC 깊이 4 넘으면 split 고려      |
| Explanation | essay 형식, 한 주제 깊이 있게       | 한 글에서 결정 둘 이상 정당화     |

한 파일이 분해 신호 셋 이상에 걸리면 type별 분리(별도 How-to + 별도 Reference + 별도 Explanation)가 옳다.

---

## 3. 메타데이터 — 1차 독자 + 답할 수 있는 질문

**모든 docs 상단에 다음 두 줄 명시:**

```markdown
> **For**: <누가 이 문서를 읽나>.
> **You'll be able to**: <읽고 나면 무엇을 할 수 있나>.
```

예시:

- For: 처음 합류한 FE 개발자 / You'll be able to: 노트북에 dev 환경 세팅하고 첫 PR 머지
- For: 배포 담당자 / You'll be able to: dev 머지 후 production까지 배포 절차 수행

이 두 줄을 쓸 수 없으면 → **그 문서 자체가 모호한 것**. 분해/재정의 신호.

---

## 4. 안티패턴

### ❌ WHAT 설명 (구현된 사실의 그대로 옮기기)

"이 함수는 X를 한다"라고 docs에 적는 것 — 코드를 읽으면 알 수 있다. docs는 **WHY/WHEN/HOW** 차원 추가가 의미 있다.

- 좋은 예: "왜 OAuth 대신 phone OTP인가" (WHY)
- 나쁜 예: "logIn() 함수는 phone과 code를 받는다" (WHAT — 코드에 있음)

### ❌ 계층 평탄화 (전부 docs/ 루트)

모든 문서를 `docs/` 직접 아래에 두면 사용자가 4 type 구분 못 하고 헤맨다. Diátaxis 디렉토리로 분리.

### ❌ 죽은 문서 (stale, 코드와 drift)

docs는 코드 변경 따라 같이 갱신해야 한다. drift 방지:

- PR이 코드를 건드렸으면 docs도 건드렸는지 셀프 체크
- `lychee` CI로 깨진 링크 자동 검출 ([`.github/workflows/docs-lint.yml`](../../.github/workflows/docs-lint.yml))
- "이 docs 마지막 업데이트는 언제?"가 1년 전이면 의심

### ❌ "향후 예정" (vaporware claim)

"X 기능은 향후 추가될 예정" 식 표현은 docs를 ‘약속의 기록부'로 만든다. 미구현 사실은 **GitHub Issue 링크로 대체**:

- 좋은 예: "현재 미지원. [#123](...)에서 트래킹 중"
- 나쁜 예: "향후 추가 예정"

---

## 5. 외부 도구 SSoT 룰

[`reference/tools.md`](../reference/tools.md)가 모든 외부 SaaS / 클라우드 / 라이브러리의 **단일 진실**이다. 다른 docs에서 외부 도구 언급 시:

- 간단 언급: 그냥 도구명만 ("Vercel 프리뷰 배포" 정도)
- 자세한 설명 필요: `→ [tools.md](../reference/tools.md)` 참조 링크
- **계정 / URL / 설정 정보 중복 금지**: tools.md에서만 관리

신규 외부 도구 도입 시 tools.md 먼저 갱신 → 그 후 다른 docs에서 사용.

### Notion 개발 문서DB vs Git 관리 `docs/*`

| 기준                           | Git `docs/` | Notion 개발 문서DB |
| ------------------------------ | ----------- | ------------------ |
| 코드/시스템과 함께 진화하는 룰 | ✅          | ❌                 |
| Claude Code / AI 가 자주 접근  | ✅          | ❌                 |
| 과거 결정의 스냅샷             | ❌          | ✅                 |
| 접근 빈도 낮음                 | ❌          | ✅                 |

---

## 6. ADR 작성 가이드

**ADR (Architecture Decision Record)**은 시스템 디자인 결정을 영구 기록하는 짧은 문서이다. PR 리뷰 코멘트에 묻혀 사라지던 결정을 추적 가능하게 한다.

### 언제 ADR 작성?

다음 중 하나라도 해당되면 작성:

- 되돌리기 어려운 결정 (DB 스키마, 외부 의존성 도입, public API 형태)
- 두 옵션 사이에서 명시적으로 선택한 결정 (REST vs gRPC, S3 단일 버킷 vs 다중)
- 코드만 봐서는 "왜 이렇게 했는지" 알 수 없는 결정
- 미래에 이 결정을 뒤집으려는 사람이 컨텍스트가 필요한 결정

다음은 ADR 불필요:

- 명백한 베스트 프랙티스 (env vars로 secret 관리 등)
- 코드 자체가 self-documenting인 결정 (변수명 컨벤션 등)
- 이미 다른 docs에 충분히 기록된 결정

### 형식

[`docs/explanation/adr/_template.md`](../explanation/adr/_template.md) (MADR 한국어 변형) 사용.

### 번호 컨벤션

- 4자리 zero-padded: `0001`, `0002`, ... `0042`
- 파일명: `<번호>-<kebab-case-제목>.md`. 예: `0002-single-s3-bucket-with-prefix.md`
- 번호는 작성 순서. 영구. supersede되어도 번호는 유지

### Status

- **Proposed**: 작성 중, 아직 미결정
- **Accepted**: 결정되어 시행 중
- **Superseded by ADR-XXXX**: 다른 ADR에 의해 대체됨
- **Deprecated**: 더 이상 유효하지 않으나 새 ADR로 명시적 대체 안 됨

### Supersede 처리

새 결정이 옛 결정을 뒤집을 때:

1. 새 ADR 작성, 본문에 "이 결정은 ADR-XXXX를 supersede 한다" 명시
2. 옛 ADR의 Status를 `Superseded by ADR-YYYY`로 변경
3. 옛 ADR 본문은 그대로 유지 (역사 보존)

---

## 7. 디렉토리 구조

```
docs/
├── README.md                      # 단일 진입점 (인간용 navigation)
├── CLAUDE.md                      # AI 자동로드용 thin pointer
├── tutorials/                     # 학습 — 손잡고 따라가는 결과
│   ├── README.md
│   └── ONBOARDING.md
├── how-to/                        # 작업 — 특정 task 실행 절차
│   ├── README.md
│   ├── write-docs.md              # 이 문서
│   ├── deployment.md
│   ├── git-workflow.md
│   ├── development-workflow.md
│   └── qa-and-testing.md
├── reference/                     # 검색 — 사실 lookup
│   ├── README.md
│   ├── team.md
│   ├── tools.md                   # 외부 도구 SSoT
│   ├── notification-deeplinks.md
│   └── specs/                     # OpenAPI spec
└── explanation/                   # 이해 — 왜 이렇게 했나
    ├── README.md
    └── adr/                       # Architecture Decision Records
        ├── README.md              # ADR 인덱스
        ├── _template.md
        └── 0001-...md
```

---

## 8. 자기 검증

이 문서 자체:

- **Type**: How-to (룰을 어떻게 적용할지). 그래서 `how-to/write-docs.md`에 둠.
- **메타데이터**: 상단 For/You'll be able to 두 줄 명시.
- **길이**: ~190줄, How-to 통념 안 (100-300줄).
- **WHAT 설명**: 룰의 의도(WHY)와 적용 방법(HOW) 위주, "코드를 읽으면 알 수 있는" 사실 없음.
- **외부 도구 참조**: tools.md 명시 인용.
