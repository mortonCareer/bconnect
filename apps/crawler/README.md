# Crawler — 기술자 크롤링 파이프라인

네이버 블로그에서 건설/인테리어 시공업체 정보를 수집하여 노션 DB에 저장하는 파이프라인.

## 파이프라인 흐름

```
검색 → 탐색 → 분류 → 중복체크 → 저장
```

### 1. 검색 (Search)

네이버 검색 API로 블로그 게시글을 검색한다.

- **입력**: 검색 쿼리 (예: `"타일 시공업체 수도권"`)
- **출력**: 블로그 게시글 URL + 블로거명 목록
- **파일**: `channels/naver_blog.py` → `search_blogs()`
- **동작**:
  - `--full` 모드에서는 58개 세부 키워드 × 2개 쿼리 템플릿 = 136개 쿼리 생성
  - 네이버 API `display` 최대 100 → 자동 페이지네이션
  - 429 응답 시 지수 백오프 재시도 (최대 3회)

### 2. 탐색 (Explore)

블로거의 프로필과 게시글을 병렬로 수집한다.

- **입력**: 블로그 게시글 URL
- **출력**: 프로필 소개, 본문, 배너 이미지, 연락처, 시공 사례 글(제목·본문·사진) 등
- **파일**: `channels/naver_blog.py` → `explore_blogger()`
- **동작**:
  1. 프로필 (모바일 DOM), 배너 (데스크톱 CSS), 게시글 본문을 `asyncio.gather`로 **동시 요청**
  2. 시공 사례 수집: 검색 글 + RSS 최근 글 총 5건 (`POSTS_PER_MEMBER`), 글당 본문 사진 최대 5장 (`IMAGES_PER_POST`, 네이버 CDN 호스트만·스티커 제외·`type=w966` 승격)
  3. 연락처 추출 — 3단계 폴백:
     - 프로필 소개글 → 수집한 글 본문 → 남은 RSS 글 (최대 20건)
  4. 각 출처별 `phone_source` 태깅 (`"profile"` | `"post"`)

  > 사진 URL은 네이버 CDN 원본을 그대로 저장 (핫링크). 외부 사이트 Referer는 403이므로 렌더 시 `referrerpolicy="no-referrer"` 필요.

### 3. 분류 (Classify)

LLM이 수집된 텍스트를 분석하여 구조화된 데이터를 추출한다.

- **입력**: 블로거명, 프로필 소개 + 게시글 본문, 블로그 제목
- **출력**: `{name, trades, rank, region(시/도), address, phone, experience, ...}`
- **파일**: `classifier.py` → `classify()`
- **동작**:
  - LLM 우선순위: Anthropic Claude → OpenAI GPT → 수동 JSON 모드
  - 시공분야는 SSOT 25개 카테고리 중 최대 3개 선택
  - 연락처는 **업체 본인 대표번호만** 추출 (고객/협력업체 번호 제외)
  - `temperature=0.1`로 일관성 확보, `response_format=json_object` (OpenAI)

### 4. 중복체크 (Dedup)

3단계 중복 방지로 불필요한 API 호출을 최소화한다.

- **파일**: `main.py` → `process_blog_result()`, `notion.py` → `find_duplicate_by_url()`
- **동작**:
  1. **메모리 중복**: 같은 실행 내 이미 처리한 `blog_id`는 즉시 스킵
  2. **노션 DB 중복**: 크롤링/LLM 전에 URL로 조회 → 이미 존재하면 싱크 시점만 갱신
  3. **저장 시 중복**: `save_technician()` 내부에서 업체명+연락처로 재확인 → 기존 레코드 enrichment

### 5. 저장 (Save)

노션 DB에 페이지를 생성하거나 기존 레코드를 보강한다.

- **입력**: `CrawledMember` 모델
- **출력**: 노션 page_id
- **파일**: `notion.py` → `save_technician()`
- **동작**:
  - 신규: 페이지 생성 + 본문 블록 (Markdown → Notion blocks 변환) + 커버 이미지
  - 기존 (기본): 빈 필드만 채우는 enrichment (기존 값 덮어쓰지 않음), 채널·싱크 시점은 항상 갱신
  - 기존 (`--force`): 모든 필드를 새 데이터로 덮어쓰기, 채널은 누적 유지

### 6. 연락처 신뢰도 판별

정규식 추출 결과의 출처에 따라 LLM 검증 여부를 결정한다.

- **프로필 소개글** 출처 (`phone_source="profile"`) → 본인이 직접 적은 번호, **LLM 검증 생략**
- **게시글/RSS** 출처 (`phone_source="post"`) → 고객 번호일 수 있어 **LLM 판별 우선**, 없으면 정규식 폴백

## 사용법

```bash
# 설치
cd apps/crawler
uv sync

# 단일 쿼리 (기본: "타일 시공업체 수도권", 3건)
uv run crawler

# 지정 쿼리 (10건)
uv run crawler "도배 시공업체 서울"

# 전체 키워드 실행 (58키워드 × 2템플릿 = 136쿼리, 기본 5건/쿼리)
uv run crawler --full

# 키워드당 수집 수 조절
uv run crawler --full --per-query 3

# dry-run: 노션 저장 없이 검색 → 탐색 → 분류까지만 실행
uv run crawler --dry-run "도배 시공업체 서울"
uv run crawler --dry-run --full --per-query 3

# force: 이미 등록된 업체도 재크롤링하여 모든 필드 덮어쓰기
uv run crawler --force "타일 시공업체 수도권"
uv run crawler --force --full --per-query 3

# 2단계 워크플로우: 검수 후 저장
# 1) dry-run으로 크롤링+분류 (보고서 JSON에 전체 데이터 저장)
uv run crawler --dry-run "타일 시공업체 수도권"
# 2) reports/xxx.json 검수 → members[] 항목 삭제/수정 → 저장
uv run crawler --from-file reports/2025-02-10_123456.json

# 특정 키워드만 실행 (Python)
uv run python -c "
import asyncio
from crawler.main import run_full, REPORTS_DIR
from crawler.progress import print_summary, console
report = asyncio.run(run_full(keywords=['타일', '도배'], per_query=5))
md = report.save(REPORTS_DIR)
print_summary(report)
"
```

### 수집 · 분류 분리 + 강한 판단자 in-loop (#920, #953)

수집(느림, 네트워크)과 분류(싸고 재실행 가능)를 나눠, 분류 방법을 바꿔도 다시 수집하지 않는다. 배포된 자동 분류기(GPT)가 놓치는 홍보·범위 밖 오탐을 더 정확한 판단자(사람 또는 강한 모델)로 걸러낼 때 쓴다.

```bash
# 1) 원본만 수집 (LLM 없이, 이미 수집/적재한 블로그는 건너뜀)
uv run crawler --collect-raw --full --per-query 20   # → reports/raw/*.jsonl

# 2) (선택) 더 정확한 판단자로 라벨 만들기
#    reports/raw 를 읽어 블로그별로 is_professional + 필드를 판단한 JSON 배열을 만든다.
#    형식: [{"id": "<blog_url>", "is_professional": true, "name": "...", "trades": [...], ...}]
#    사람이든 강한 모델(예: Claude)이든 무엇이 만들어도 된다.

# 3) 원본에서 분류만 실행 (라벨이 있으면 그 블로그는 LLM 대신 라벨 사용)
uv run crawler --classify-from-raw reports/raw/naver-<시각>.jsonl --labels labels.json
#    → reports/<시각>.json 에 통과한 기술자(members[]) 저장. 라벨에 없는 블로그는 기본 LLM 이 분류.

# 4) 통과한 기술자를 crawled_* DB 에 적재 (upsert, CRAWLED_DB_URL 필요)
uv run crawler --export-db reports/<시각>.json
```

규칙 선필터(#915)가 확실한 비-기술자(자동차·인력사무소·협찬글 등)를 라벨/LLM 전에 먼저 제거하므로, 판단 비용이 드는 대상만 라벨/LLM 으로 넘어간다.

## 환경변수

`.env.example`을 `.env`로 복사한 후 값을 채운다.

| 변수                  | 필수 | 설명                                                                 |
| --------------------- | ---- | -------------------------------------------------------------------- |
| `NAVER_CLIENT_ID`     | O    | [네이버 개발자 센터](https://developers.naver.com/apps) 앱 Client ID |
| `NAVER_CLIENT_SECRET` | O    | 네이버 앱 Client Secret                                              |
| `NOTION_TOKEN`        | O    | [노션 인테그레이션](https://www.notion.so/my-integrations) 토큰      |
| `NOTION_DATABASE_ID`  | O    | 대상 노션 DB ID (URL에서 추출)                                       |
| `OPENAI_API_KEY`      | △    | OpenAI API 키 (Anthropic 미설정 시 필수)                             |
| `OPENAI_MODEL`        | -    | 기본값: `gpt-4o-mini`                                                |
| `ANTHROPIC_API_KEY`   | △    | Anthropic API 키 (설정 시 OpenAI보다 우선)                           |
| `ANTHROPIC_MODEL`     | -    | 기본값: `claude-sonnet-4-5-20250929`                                 |

> LLM은 Anthropic과 OpenAI 중 하나만 설정하면 된다. 둘 다 없으면 수동 분류 모드로 동작.

## 보고서

파이프라인 실행 후 `reports/` 디렉토리에 자동 생성된다.

- `YYYY-MM-DD_HHMMSS.md` — 실행 요약, 파라미터, 비용 추정, 에러 로그
- `YYYY-MM-DD_HHMMSS.json` — 업체별 상세 결과 (기계 판독용)

중단(Ctrl+C) 시에도 부분 보고서가 저장된다.

## 프로젝트 구조

```
src/crawler/
├── main.py              # 파이프라인 오케스트레이션, CLI 진입점
├── config.py            # 환경변수 설정 (pydantic-settings)
├── models.py            # CrawledMember 모델(BE 계약 동형), TRADES/RANKS/SEARCH_KEYWORDS 정의
├── classifier.py        # LLM 분류 (Anthropic/OpenAI/수동)
├── notion.py            # 노션 DB CRUD, 중복체크, enrichment
├── progress.py          # Rich 프로그레스 바, 요약 테이블
├── report.py            # 실행 보고서 (Markdown + JSON)
└── channels/
    └── naver_blog.py    # 네이버 블로그 검색·파싱·연락처 추출
```

## 비용 참고

| 모델          | 입력     | 출력     | 100건 기준 예상 |
| ------------- | -------- | -------- | --------------- |
| gpt-4o-mini   | $0.15/1M | $0.60/1M | ~$0.03          |
| gpt-4o        | $2.50/1M | $10.0/1M | ~$0.50          |
| claude-sonnet | $3.00/1M | $15.0/1M | ~$0.60          |

> 이미 등록된 업체는 LLM 호출 없이 싱크 시점만 갱신 (비용 $0).

## 테스트

```bash
uv run pytest tests/ -v
```

## 주의사항

- **네이버 API 일일 호출 한도**: 25,000건/일. `--full` 모드(136쿼리)는 문제없으나, `--per-query`를 높이면 페이지네이션으로 호출 수 증가
- **노션 API 레이트 리밋**: 초당 3요청. 대량 저장 시 429 에러 가능
- **LLM 비용**: `--full --per-query 5`로 전체 실행 시 신규 업체 수에 비례. 보고서의 비용 추정 확인
- **개인정보**: 수집된 연락처는 `source_urls`로 출처를 추적. 개인정보보호법 준수 필요
- **중복 실행 안전**: 동일 파이프라인을 여러 번 돌려도 기존 데이터를 덮어쓰지 않음 (enrichment만). `--force`를 쓰면 의도적으로 덮어쓰기 가능

## 로드맵

### 운영 개선

- [ ] **쿼리 간 병렬화** — 현재 쿼리는 순차 실행. 2~3개씩 묶어 병렬로 돌리면 `--full` 시간 대폭 단축
- [ ] **재시도 로직 강화** — 네이버 검색 API 실패 시 개별 쿼리 재시도 (현재는 실패하면 그냥 넘어감)
- [ ] **파일 로깅** — 트래커 모드에서도 디버그 로그를 파일에 보존

### 데이터 품질

- [ ] **연락처 채움률 올리기** — 현재 70%. 비즈니스 프로필, 네이버 플레이스 등 추가 소스 탐색
- [ ] **주소/이메일 채움률** — 각각 40%, 10%. LLM으로 게시글에서 추가 추출

### 테스트 보강

- [ ] **통합 테스트** — mock 노션 API로 전체 플로우 검증
- [ ] **PipelineTracker 유닛 테스트**
- [ ] **edge case** — 빈 검색결과, 노션 타임아웃 등

### 기능 확장

- [ ] **스케줄러** — cron/GitHub Actions로 주기적 실행
- [ ] **증분 크롤링** — 마지막 싱크 이후 변경분만 처리
- [ ] **다른 플랫폼** — 네이버 블로그 외 카카오, 구글 등
