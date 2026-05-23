from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings and environment variables manager.
    Pydantic will automatically validate that these exist in the .env file.
    """

    ENVIRONMENT: str = "development"

    # IANA timezone string, e.g. "America/Mexico_City", "Europe/Madrid", "UTC"
    TIMEZONE: str = "UTC"

    # Supabase credentials
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str

    # Dev bypass — allows the fake "dev-bypass-token" in deps.py; NEVER enable in prod
    BYPASS_AUTH: bool = False

    # Gemini API
    GEMINI_API_KEY: str | None = None

    # CORS — comma-separated in .env, e.g.: ALLOWED_ORIGINS=http://localhost:3000,https://app.kognis.com
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v: object) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v  # type: ignore[return-value]

    # Load from the .env file in the backend directory
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


# Instantiate the settings to be imported across the application
settings = Settings()
