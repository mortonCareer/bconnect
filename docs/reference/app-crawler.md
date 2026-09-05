# 기술자 크롤러

> 대상: 크롤러 작업자<br>
> 학습 목표: 크롤러 실행 명령과 검수 파이프라인 구조를 확인한다<br>
> 위치: `apps/crawler`

기술자 정보 크롤러입니다. 네이버 블로그에서 건설·인테리어 시공업체 정보를 수집합니다. 수집 결과는 노션 검수 DB에 저장합니다.

## 명령어

```bash
# 설치
uv sync

# 크롤링 · 검수 DB 적재
uv run crawler
uv run crawler <query>                  # 지정 쿼리
uv run crawler --full
uv run crawler --full --per-query 3     # 키워드당 수집 수
uv run crawler --enrich

# 검수 · 저장
uv run crawler --dry-run                # 검수 DB 미적재
uv run crawler --from-file <name>       # 검수 보고서 저장
uv run crawler --force                  # 덮어쓰기
uv run crawler --approve                # 검수 DB → 프로덕션 DB 이전
uv run crawler --direct                 # 프로덕션 DB 적재

# 테스트
uv run --dev pytest tests/ -v
```

### 수집 · 분류 분리 · 강한 판단자 in-loop (#920, #953)

수집과 분류를 나눠 분류 방법을 바꿔도 다시 수집하지 않습니다.

- 수집은 느리고 네트워크에 의존
- 분류는 싸고 재실행 가능
- 배포된 자동 분류기인 GPT가 놓치는 홍보·범위 밖 오탐을 걸러낼 때 사용
- 더 정확한 판단자는 사람 또는 강한 모델

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

### 특정 키워드만 실행

```bash
uv run python -c "
import asyncio
from crawler.main import run_full, REPORTS_DIR
from crawler.progress import print_summary, console
report = asyncio.run(run_full(keywords=['타일', '도배'], per_query=5))
md = report.save(REPORTS_DIR)
print_summary(report)
"
```

## 패키지 구조

Channel pattern.

```text
apps/crawler/src/crawler/
├── main.py              # CLI 진입점, 파이프라인 오케스트레이션
├── config.py            # 환경변수 설정 (pydantic-settings)
├── models.py            # CrawledMember 모델(BE CrawledMemberResponse 동형), TRADES/RANKS/SEARCH_KEYWORDS 정의
├── classifier.py        # LLM 분류 (Anthropic/OpenAI/수동)
├── notion.py            # 노션 DB CRUD, 중복체크, enrichment
├── progress.py          # Rich 프로그레스 바, 요약 테이블
├── report.py            # 실행 보고서 (Markdown + JSON)
└── channels/            # 채널별 크롤러
    ├── naver_blog.py    # 네이버 블로그 검색·파싱·연락처 추출
    └── instagram.py
```

채널 선택은 `--channel blog|instagram|all` 옵션으로 합니다.

## 환경변수

`.env.example`을 `.env`로 복사한 후 값을 채웁니다.

| 변수                  | 필수 | 설명                                                                 |
| --------------------- | ---- | -------------------------------------------------------------------- |
| `NAVER_CLIENT_ID`     | O    | [네이버 개발자 센터](https://developers.naver.com/apps) 앱 Client ID |
| `NAVER_CLIENT_SECRET` | O    | 네이버 앱 Client Secret                                              |
| `NOTION_TOKEN`        | O    | [Notion 인테그레이션](https://www.notion.so/my-integrations) 토큰    |
| `NOTION_DATABASE_ID`  | O    | 대상 노션 DB ID. URL에서 추출                                        |
| `OPENAI_API_KEY`      | △    | OpenAI API 키. Anthropic 미설정 시 필수                              |
| `OPENAI_MODEL`        | -    | 기본값 `gpt-4o-mini`                                                 |
| `ANTHROPIC_API_KEY`   | △    | Anthropic API 키. 설정 시 OpenAI보다 우선                            |
| `ANTHROPIC_MODEL`     | -    | 기본값 `claude-sonnet-4-5-20250929`                                  |

추가로 필요한 값입니다.

- 검수 DB 사용 시 `notion_review_database_id`
- `--export-db` 사용 시 `CRAWLED_DB_URL`

## 파이프라인 흐름

```text
검색 → 탐색 → 분류 → 중복체크 → 저장
```

## 동작 파라미터

- LLM throttle. text 는 `_LLM_INTERVAL = 3.0s`, vision 은 `_LLM_VISION_INTERVAL = 8.0s`
  - 429 retry 는 exponential backoff. 5/10/20s 를 3회
- DB 분리. 메인 DB 는 `notion_database_id`, 검수 DB 는 `notion_review_database_id`
  - 검수 후 승인된 레코드만 메인으로 이동
- Concurrency. general 은 `CONCURRENCY = 5`, `--full` mode 는 `QUERY_CONCURRENCY = 3`
  - enrich mode 는 `CONCURRENCY * 4 = 20`
- httpx timeout 은 15s
- Reports 는 `reports/` 디렉토리. markdown · log · json 생성

## 보고서

파이프라인 실행 후 `reports/` 디렉토리에 자동 생성됩니다.

- `YYYY-MM-DD_HHMMSS.md` : 실행 요약, 파라미터, 비용 추정, 에러 로그
- `YYYY-MM-DD_HHMMSS.json` : 업체별 상세 결과. 기계 판독용

Ctrl+C 로 중단해도 부분 보고서가 저장됩니다.

## 비용 참고

| 모델          | 입력     | 출력     | 100건 기준 예상 |
| ------------- | -------- | -------- | --------------- |
| gpt-4o-mini   | $0.15/1M | $0.60/1M | ~$0.03          |
| gpt-4o        | $2.50/1M | $10.0/1M | ~$0.50          |
| claude-sonnet | $3.00/1M | $15.0/1M | ~$0.60          |

> 이미 등록된 업체는 LLM 호출 없이 싱크 시점만 갱신합니다. 비용은 $0 입니다.

## 주의사항

- 네이버 API 일일 호출 한도는 25,000건
  - 136쿼리인 `--full` 모드는 문제없음
  - `--per-query`를 높이면 페이지네이션으로 호출 수 증가
- 노션 API 레이트 리밋은 초당 3요청. 대량 저장 시 429 에러 가능
- LLM 비용은 `--full --per-query 5`로 전체 실행 시 신규 업체 수에 비례. 보고서의 비용 추정 확인
- 개인정보. 수집된 연락처는 `source_urls`로 출처를 추적. 개인정보보호법 준수 필요
- 중복 실행 안전. 동일 파이프라인을 여러 번 돌려도 기존 데이터를 덮어쓰지 않고 enrichment 만 수행
  - `--force`를 쓰면 의도적으로 덮어쓰기 가능

## 로드맵

### 운영 개선

- [ ] 쿼리 간 병렬화. 현재 쿼리는 순차 실행. 2~3개씩 묶어 병렬로 돌리면 `--full` 시간 대폭 단축
- [ ] 재시도 로직 강화. 네이버 검색 API 실패 시 개별 쿼리 재시도. 현재는 실패하면 그냥 넘어감
- [ ] 파일 로깅. 트래커 모드에서도 디버그 로그를 파일에 보존

## 참조

- `.github/workflows/ci.yml`
- [네이버 개발자 센터](https://developers.naver.com/apps)
- [Notion 인테그레이션](https://www.notion.so/my-integrations)
