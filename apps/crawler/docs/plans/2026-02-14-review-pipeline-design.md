# 검수 파이프라인 설계 (Phase 1)

## 목적

크롤링 파이프라인에 인간 검수 단계를 추가하여 데이터 정확도를 개선한다.
크롤러가 프로덕션 DB에 직접 저장하는 대신, 별도 검수 DB에 저장하고
인간이 Notion에서 리뷰/수정 후 승인하면 프로덕션으로 이동한다.

## 접근 방식

**A안 채택: 별도 검수 DB**

```
[AS-IS] 크롤러 → 프로덕션 DB
[TO-BE] 크롤러 → 검수 DB → 인간 검수 → CLI --approve → 프로덕션 DB
```

선택 이유:
- 프로덕션 DB가 미검수 데이터로 오염되지 않음
- Notion UI에서 상태별 필터링으로 편리한 리뷰
- Phase 2 (거절 패턴 분석) 시 검수 DB에 이력이 남아 유리

## 검수 DB 스키마

프로덕션 DB 스키마 미러링 + 검수 전용 컬럼:

| 속성 | 타입 | 비고 |
|------|------|------|
| 업체명 | title | |
| **검수상태** | select | 대기중 / 승인 / 거절 |
| **거절사유** | rich_text | 거절 시 사유 기록 (Phase 2 분석용) |
| 구분 | select | rank |
| 시공분야 | multi_select | trades |
| 채널 | multi_select | 수집 채널 |
| 대표자 | rich_text | |
| 지역 | select | |
| 주소 | rich_text | |
| 연락처 | phone_number | |
| 이메일 | email | |
| 사업자등록번호 | rich_text | |
| 경력 | number | |
| 인증 | multi_select | |
| 자세히보기 | url | detail_url |
| 최종 수집 일시 | date | |

## CLI 인터페이스

```bash
# 크롤링 (기존 명령어, 저장 대상만 검수 DB로 변경)
uv run crawler "인테리어 전기"           # → 검수 DB
uv run crawler --full                   # → 검수 DB

# 검수 건 프로덕션 이동
uv run crawler --approve                # 검수 DB "승인" → 프로덕션 DB

# 프로덕션 직접 저장 (escape hatch)
uv run crawler --direct "인테리어 전기"  # → 프로덕션 DB (기존 동작)
```

## 코드 변경

### config.py
- `NOTION_REVIEW_DATABASE_ID` 환경변수 추가

### notion.py
새 함수:
- `save_to_review()` — 검수 DB에 저장 (검수상태=대기중)
- `find_review_duplicate()` — 검수 DB 내 중복 체크
- `find_approved()` — 검수상태=승인 건 조회
- `move_to_production()` — 승인 건 프로덕션 복사 + 검수 DB 상태 유지

기존 함수 재활용:
- `_build_properties()`, `_build_body_markdown()`, `_markdown_to_blocks()` — 검수/프로덕션 동일
- `find_duplicate()` — 프로덕션 중복 체크 (이동 시)
- `validate_schema()` — 검수 DB 스키마 검증 추가

### main.py
- 기존 `run_pipeline()`, `run_full()`: `save_technician()` → `save_to_review()` 로 변경
- 새 함수 `run_approve()`: --approve 핸들러
- 새 CLI 인자: `--approve`, `--direct`
- `--direct` 플래그 시 기존 `save_technician()` 사용

### report.py
- approve 실행 시 리포트: 이동 건수, 실패 건수, 중복 건수

## 핵심 로직

### 중복 체크 전략

- **검수 모드 (기본)**: 프로덕션 DB 중복 체크를 건너뜀. 검수 DB 내 중복만 체크.
  → 이미 프로덕션에 있는 업체도 검수 DB에 들어가며, 승인 시 프로덕션에서 업데이트됨.
- **direct 모드**: 기존과 동일하게 프로덕션 DB 중복 체크 후 스킵 또는 덮어쓰기.

### save_to_review(technician)
1. 검수 DB에서 중복 체크 (detail_url 기준)
2. 중복이면 업데이트 (enrich 방식)
3. 없으면 새로 생성 (검수상태="대기중")
4. 본문/커버 이미지도 프로덕션과 동일하게 저장

### run_approve()
1. 검수 DB에서 검수상태="승인" 건 전체 조회
2. 각 건에 대해:
   a. 프로덕션 DB에서 중복 체크
   b. 중복이면 업데이트, 없으면 생성
   c. 성공 시 로그 기록
3. 리포트 출력 (이동/중복/실패 건수)

## 승인 후 처리

검수 DB 레코드는 삭제하지 않고 승인 상태로 보존.
이유: Phase 2에서 승인/거절 패턴 분석에 활용.

## Phase 2 예고 (이번 범위 밖)

- 거절 사유 분석 리포트
- 승인율/거절율 추적
- 피드백 기반 LLM 프롬프트 자동 개선
