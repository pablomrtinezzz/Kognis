from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings and environment variables manager.
    Pydantic will automatically validate that these exist in the .env file.
    """

    ENVIRONMENT: str = "development"

    # Supabase credentials
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str

    # Gemini API
    GEMINI_API_KEY: str | None = None

    # Load from the .env file in the backend directory
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


# Instantiate the settings to be imported across the application
settings = Settings()
