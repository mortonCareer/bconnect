from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # Naver Search API
    naver_client_id: str
    naver_client_secret: str

    # LLM (Anthropic 우선, OpenAI 폴백)
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-5-20250929"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Notion
    notion_token: str
    notion_database_id: str = "bc8b0266918d4d91b8171ba5203d0bdf"
    notion_review_database_id: str = ""  # 검수 DB (비어있으면 검수 기능 비활성)

    # YouTube (optional)
    youtube_api_key: str = ""

    # crawled_* DB 적재 (--export-db). Railway dev Postgres public URL 등
    crawled_db_url: str = ""


settings = Settings()
