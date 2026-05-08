# apps/crawler

기술자 정보 크롤러. Python + uv 패키지 매니저. Notion DB로 sync.

## Commands

```bash
cd apps/crawler && uv run crawler [args]              # 크롤러 실행
cd apps/crawler && uv run --dev pytest tests/ -v      # 테스트
cd apps/crawler && uv run crawler --full              # 전체 sweep
cd apps/crawler && uv run crawler --enrich            # enrichment only
```

> 명령 실행 위치 주의: `cd apps/crawler` 후 실행. 루트에서는 동작 X.

## 구조 (Channel pattern)

```text
apps/crawler/src/crawler/
├── main.py              # CLI + 파이프라인 오케스트레이션
├── channels/            # 채널별 크롤러
│   ├── naver_blog.py
│   └── instagram.py
├── classifier.py        # LLM 분류 (Anthropic/OpenAI)
├── notion.py            # Notion DB sync
├── models.py            # Technician model + TRADES, RANKS
└── config.py            # pydantic-settings
```

`--channel blog|instagram|all` 옵션으로 채널 선택.

## Patterns

- **LLM throttle**: `_LLM_INTERVAL = 3.0s` (text), `_LLM_VISION_INTERVAL = 8.0s` (vision). 429 retry exponential backoff (5/10/20s × 3회).
- **DB 분리**: 메인 DB(`notion_database_id`) vs 검수 DB(`notion_review_database_id`). 검수 후 승인된 레코드만 메인으로.
- **Concurrency**: `CONCURRENCY = 5` (general), `QUERY_CONCURRENCY = 3` (--full mode), enrich mode는 `CONCURRENCY * 4 = 20`.
- **httpx timeout**: 15s.
- **Reports**: `reports/` 디렉토리 (markdown + log + json).

## 환경 변수 필수

```text
naver_client_id, naver_client_secret  # Naver Search API
notion_token                           # Notion Integration
anthropic_api_key | openai_api_key     # 분류 LLM
```

## CI

`.github/workflows/ci.yml`의 `ci-crawler` job (path filter: `apps/crawler/**`).
