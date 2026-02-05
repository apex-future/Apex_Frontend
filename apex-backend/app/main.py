from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
from dotenv import load_dotenv
print(" APEX BACKEND VERSION 1.0 - CONTAINER STARTED ")

from app import schemas, crud
from app.database import DATABASE_KIND

# Load environment variables
load_dotenv()

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
    allow_origins=[frontend_url, "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
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
def join_waitlist(waitlist_entry: schemas.WaitlistCreate):
    """
    Add an email to the waitlist using Supabase.
    """
    existing_entry = crud.get_waitlist_entry_by_email(waitlist_entry.email)
    if existing_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already on the waitlist!"
        )

    supa_entry = crud.create_waitlist_entry(waitlist_entry.email)
    if supa_entry is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add email to waitlist. Please try again."
        )

    return supa_entry

# Get waitlist count
@app.get("/api/waitlist/count")
def get_count():
    """Get total number of people on waitlist"""
    count = crud.get_waitlist_count()
    return {"count": count}

# Get all waitlist entries
@app.get("/api/waitlist", response_model=list[schemas.WaitlistResponse])
def get_all_entries(skip: int = 0, limit: int = 100):
    entries = crud.get_all_waitlist_entries(skip=skip, limit=limit)
    return entries