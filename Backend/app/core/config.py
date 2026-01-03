from pydantic_settings import BaseSettings
from typing import List, Optional
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartLend Credit Engine"
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # --- Infrastructure ---
    DATABASE_URL: str

    # --- Supabase ---
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str 
    SUPABASE_JWT_SECRET: str
    ARTIFACTS_DIR: Path = Path("artifacts")
    MAX_PD_CUTOFF: float = 0.30          
    MIN_PROFIT_BUFFER: float = 50.0   
    class Config:
        env_file = ".env"
        extra = "forbid"  # explicit & intentional


settings = Settings()
