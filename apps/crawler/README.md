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
- **출력**: 프로필 소개, 본문, 배너 이미지, 연락처 등
- **파일**: `channels/naver_blog.py` → `explore_blogger()`
- **동작**:
  1. 프로필 (모바일 DOM), 배너 (데스크톱 CSS), 게시글 본문을 `asyncio.gather`로 **동시 요청**
  2. 연락처 추출 — 3단계 폴백:
     - 프로필 소개글 → 게시글 본문 → RSS 최근 5건
  3. 각 출처별 `phone_source` 태깅 (`"profile"` | `"post"`)

### 3. 분류 (Classify)

LLM이 수집된 텍스트를 분석하여 구조화된 데이터를 추출한다.

- **입력**: 블로거명, 프로필 소개 + 게시글 본문, 블로그 제목
- **출력**: `{name, trades, rank, region, address, phone}`
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

- **입력**: `Technician` 모델
- **출력**: 노션 page_id
- **파일**: `notion.py` → `save_technician()`
- **동작**:
  - 신규: 페이지 생성 + 본문 블록 (Markdown → Notion blocks 변환) + 커버 이미지
  - 기존: 빈 필드만 채우는 enrichment (기존 값 덮어쓰지 않음), 채널·싱크 시점은 항상 갱신

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
├── models.py            # Technician 모델, TRADES/RANKS/SEARCH_KEYWORDS 정의
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
- **중복 실행 안전**: 동일 파이프라인을 여러 번 돌려도 기존 데이터를 덮어쓰지 않음 (enrichment만)
