from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from .env. Use SQLite if unset or when Supabase is unreachable (DNS/network).
_raw_url = os.getenv("DATABASE_URL", "").strip()
if not _raw_url or _raw_url.lower().startswith("sqlite"):
    # Local SQLite – no internet needed. File: apex-backend/apex.db
    DATABASE_URL = "sqlite:///./apex.db"
    _engine_args = {"connect_args": {"check_same_thread": False}}
    _pool_pre_ping = False
else:
    DATABASE_URL = _raw_url
    _engine_args = {}
    _pool_pre_ping = True
    if "sslmode" not in DATABASE_URL and "supabase" in DATABASE_URL.lower():
        DATABASE_URL = f"{DATABASE_URL}?sslmode=require" if "?" not in DATABASE_URL else f"{DATABASE_URL}&sslmode=require"

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=_pool_pre_ping,
    echo=True if os.getenv("DEBUG") == "True" else False,
    **_engine_args,
)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()