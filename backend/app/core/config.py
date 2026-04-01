from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os, pathlib

# Ensure .env is loaded and take precedence over system env vars for critical DB config
_env_path = pathlib.Path(__file__).parent.parent.parent / ".env"
load_dotenv(_env_path, override=True)

# Explicitly ensure system's DATABASE_URL doesn't override our choice if it exists in env
# (especially for machines with global postgres defaults)
if "DATABASE_URL" in os.environ:
    # If the system env var is different from what's in .env, we prioritize .env
    pass 

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    UPLOAD_DIR: str = "uploads"
    FAISS_INDEX_PATH: str = "faiss_index"

    class Config:
        env_file = ".env"
        # This ensures that values from .env take priority over environment variables
        env_file_encoding = 'utf-8'

settings = Settings()
