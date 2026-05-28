"""
Core Configuration — Helios-Watch Backend

Loads all settings from environment variables / .env file.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend root (one level up from app/)
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    # JWT Configuration
    JWT_SECRET: str = os.getenv("JWT_SECRET", "helios-watch-super-secret-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # 7 days

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./helios.db")

    # CORS Origins
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
        ).split(",")
    ]

    # Cookie name for JWT
    COOKIE_NAME: str = "helios_token"


settings = Settings()
