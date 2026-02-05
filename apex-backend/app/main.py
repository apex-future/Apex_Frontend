from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
import logging
import os
from dotenv import load_dotenv

from app import models, schemas, crud
from app.database import engine, get_db, DATABASE_KIND

# Load environment variables
load_dotenv()

# Create database tables (if they don't exist). Skip if DB is unreachable (e.g. no network).
try:
    models.Base.metadata.create_all(bind=engine)
except OperationalError as e:
    logging.warning(
        "Database unreachable (tables not created). Check internet and DATABASE_URL. Error: %s",
        e,
    )

# Initialize FastAPI app
app = FastAPI(
    title="Apex Waitlist API",
    description="Backend API for Apex waitlist management",
    version="1.0.0"
)

# CORS Configuration
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://127.0.0.1:5173"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Return clear JSON when database is unreachable; in DEBUG log the real error
@app.exception_handler(OperationalError)
def handle_db_unavailable(request, exc):
    err_msg = str(exc.orig) if getattr(exc, "orig", None) else str(exc)
    logging.warning("Database OperationalError: %s", err_msg)
    # User-friendly message; in DEBUG you can check server logs for the real error
    detail = "A network issue is preventing us from saving your request. Please check your connection and try again."
    if os.getenv("DEBUG") == "True":
        detail = f"Database error: {err_msg}"
    return JSONResponse(
        status_code=503,
        content={"detail": detail},
    )

# Root endpoint (shows which database is in use)
@app.get("/")
def read_root():
    return {
        "message": "Apex Waitlist API",
        "status": "running",
        "database": DATABASE_KIND,
        "docs": "/docs"
    }

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Add email to waitlist
@app.post("/api/waitlist", response_model=schemas.WaitlistResponse, status_code=status.HTTP_201_CREATED)
def join_waitlist(
    waitlist_entry: schemas.WaitlistCreate,
    db: Session = Depends(get_db)
):
    """
    Add an email to the waitlist.
    
    - **email**: Valid email address
    
    Returns the created waitlist entry.
    """
    # Check if email already exists
    existing_entry = crud.get_waitlist_entry_by_email(db, email=waitlist_entry.email)
    if existing_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already on the waitlist!"
        )
    
    # Create new entry
    db_entry = crud.create_waitlist_entry(db, email=waitlist_entry.email)
    
    if db_entry is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add email to waitlist. Please try again."
        )
    
    return db_entry

# Get waitlist count (public)
@app.get("/api/waitlist/count")
def get_count(db: Session = Depends(get_db)):
    """Get total number of people on waitlist"""
    count = crud.get_waitlist_count(db)
    return {"count": count}

# Get all waitlist entries (admin only - add auth later)
@app.get("/api/waitlist", response_model=list[schemas.WaitlistResponse])
def get_all_entries(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all waitlist entries.
    
    TODO: Add authentication for admin access
    """
    entries = crud.get_all_waitlist_entries(db, skip=skip, limit=limit)
    return entries