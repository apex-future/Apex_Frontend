from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# ==============================
# SUPABASE CLIENT
# ==============================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ==============================
# DATABASE (SQLAlchemy)
# ==============================
_raw_url = os.getenv("DATABASE_URL", "").strip()
if not _raw_url or _raw_url.lower().startswith("sqlite"):
    DATABASE_URL = "sqlite:///./apex.db"
    DATABASE_KIND = "sqlite"
    _engine_args = {"connect_args": {"check_same_thread": False}}
    _pool_pre_ping = False
else:
    DATABASE_URL = _raw_url
    DATABASE_KIND = "postgres"
    _engine_args = {}
    _pool_pre_ping = True
    if "sslmode" not in DATABASE_URL and "supabase" in DATABASE_URL.lower():
        DATABASE_URL = f"{DATABASE_URL}?sslmode=require" if "?" not in DATABASE_URL else f"{DATABASE_URL}&sslmode=require"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=_pool_pre_ping,
    echo=True if os.getenv("DEBUG") == "True" else False,
    **_engine_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()