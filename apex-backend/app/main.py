from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
from dotenv import load_dotenv

#  Debug print to verify container start
print(" APEX BACKEND VERSION 1.1 - CONTAINER STARTED ")

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

# ============================
# Root & Health endpoints
# ============================

@app.get("/")
def read_root():
    return {
        "message": "Apex Waitlist API",
        "status": "running",
        "database": DATABASE_KIND,
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# ============================
# Waitlist Endpoints
# ============================

@app.post("/api/waitlist", response_model=schemas.WaitlistResponse, status_code=status.HTTP_201_CREATED)
def join_waitlist(waitlist_entry: schemas.WaitlistCreate):
    """
    Add an email to the waitlist using Supabase.

    Headers:
    Cache-Control: no-store to prevent 304 responses
    """
    try:
        # Check if email already exists
        existing_entry = crud.get_waitlist_entry_by_email(waitlist_entry.email)
        if existing_entry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already on the waitlist!"
            )

        # Insert into Supabase
        supa_entry = crud.create_waitlist_entry(waitlist_entry.email)
        print("DEBUG: Supabase insert result:", supa_entry)

        if supa_entry is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add email to waitlist. Please check Supabase logs."
            )

        # Force no caching for this POST
        headers = {"Cache-Control": "no-store"}
        return JSONResponse(content=supa_entry, status_code=201, headers=headers)

    except Exception as e:
        logging.error("Unexpected error in join_waitlist: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected server error: {e}"
        )

@app.get("/api/waitlist/count")
def get_count():
    """Get total number of people on waitlist"""
    try:
        count = crud.get_waitlist_count()
        return {"count": count}
    except Exception as e:
        logging.error("Error fetching waitlist count: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected server error: {e}"
        )

@app.get("/api/waitlist", response_model=list[schemas.WaitlistResponse])
def get_all_entries(skip: int = 0, limit: int = 100):
    """Get all waitlist entries"""
    try:
        entries = crud.get_all_waitlist_entries(skip=skip, limit=limit)
        return entries
    except Exception as e:
        logging.error("Error fetching all waitlist entries: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected server error: {e}"
        )