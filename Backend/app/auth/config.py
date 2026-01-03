from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # -------------------------------------------------
    # App
    # -------------------------------------------------
    PROJECT_NAME: str = "SmartLend Engine"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "dev"

    # -------------------------------------------------
    # CORS
    # -------------------------------------------------
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://smartlend-dashboard.vercel.app",
    ]

    # -------------------------------------------------
    # Database (Supabase Postgres)
    # -------------------------------------------------
    DATABASE_URL: str

    # -------------------------------------------------
    # Supabase Auth (ANON KEY ONLY)
    # -------------------------------------------------
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str

    # -------------------------------------------------
    # ML Artifacts
    # -------------------------------------------------
    ARTIFACTS_DIR: str = "artifacts/"

    # -------------------------------------------------
    # Policy Constants
    # -------------------------------------------------
    MIN_PROFIT_BUFFER: float = 50.0
    MAX_PD_CUTOFF: float = 0.30
    LGD_ASSUMPTION: float = 1.0

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
