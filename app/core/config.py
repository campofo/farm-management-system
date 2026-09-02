from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Smart Agricultural Farm Management System"
    app_env: str = "development"
    secret_key: str = "change-this-secret-key-before-production"
    access_token_expire_minutes: int = 1440
    database_url: str = "sqlite:///./farm_management.db"
    cors_origins: str = "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:3000,http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
