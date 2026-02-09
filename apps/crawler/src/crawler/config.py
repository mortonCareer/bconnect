from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # Naver Search API
    naver_client_id: str
    naver_client_secret: str

    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"

    # Notion
    notion_token: str
    notion_database_id: str = "bc8b0266918d4d91b8171ba5203d0bdf"

    # YouTube (optional)
    youtube_api_key: str = ""


settings = Settings()
