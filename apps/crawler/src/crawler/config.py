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

    # YouTube (optional)
    youtube_api_key: str = ""


settings = Settings()
