from fastapi import FastAPI, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
from dotenv import load_dotenv
import resend

#  Debug print to verify container start
print(" APEX BACKEND VERSION 1.1 - CONTAINER STARTED ")

from app import schemas, crud
from app.database import DATABASE_KIND

# Load environment variables
load_dotenv()

# Configure Resend
resend.api_key = os.getenv("RESEND_API_KEY")
# In app/main.py
FROM_EMAIL = os.getenv("FROM_EMAIL", "Apex <Apex@contact.apexapp.click>")

# Initialize FastAPI app
app = FastAPI(
    title="Apex Waitlist API",
    description="Backend API for Apex waitlist management",
    version="1.0.0"
)

# CORS Configuration
# Check for multiple possible env var names (CORS_ORIGINS or FRONTEND_URL)
cors_origins_raw = os.getenv("CORS_ORIGINS") or os.getenv("FRONTEND_URL") or "http://localhost:5173,http://193.181.214.73,https://apexapp.click,http://apexapp.click,https://contact.apexapp.click,http://localhost:3000"
allowed_origins = [origin.strip() for origin in cors_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
def join_waitlist(waitlist_entry: schemas.WaitlistCreate, background_tasks: BackgroundTasks):
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

        # TASK 3 — NEW USER SIGNUP EMAIL:
        # After successful signup, send a welcome email in the background.
        background_tasks.add_task(send_welcome_email, waitlist_entry.email)

        # Force no caching for this POST
        headers = {"Cache-Control": "no-store"}
        return JSONResponse(content=supa_entry, status_code=201, headers=headers)

    except Exception as e:
        logging.error("Unexpected error in join_waitlist: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected server error: {e}"
        )

def send_welcome_email(email_address: str):
    """Logic to send the branded welcome email"""
    try:
        # EDIT WELCOME EMAIL CONTENT HERE
        subject = "You're on the list."
        
        # Extraction logic: take part before @, split by delimiters, strip numbers
        raw_name = email_address.split('@')[0]
        name_part = raw_name.replace('.', ' ').replace('_', ' ').replace('-', ' ').split()[0].rstrip('0123456789')
        first_name = name_part.capitalize()

        html_content = f"""
        <div style="font-family: sans-serif; color: #0A0A0A; background-color: #FFFFFF; padding: 40px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #E5E5E5;">
            <p style="font-size: 16px; margin-bottom: 24px;">Hey {first_name},</p>
            
            <p style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">You're in.</p>
            
            <p style="margin-bottom: 16px;">The <span style="color: #8B5CF6; font-weight: bold;">Apex</span> waitlist just got one name longer — and it's yours.</p>
            
            <p style="margin-bottom: 16px;">We're building the learning tool students actually deserve. No more broken focus. No more tab switching. No more studying hard and understanding nothing.</p>
            
            <p style="margin-bottom: 16px;">Just you, your books, and everything you need to <span style="color: #8B5CF6;">go deep</span> — <strong>AI explanations, dictionary, videos, highlights</strong> — all in one place. All instant.</p>
            
            <p style="margin-bottom: 16px;">Right now, we're heads down building. Soon, we're opening a <span style="background-color: #8B5CF6; color: #FFFFFF; padding: 2px 6px; border-radius: 4px; font-weight: bold;">private beta</span> — a small, handpicked group of students who will get in before the world does.</p>
            
            <p style="margin-bottom: 16px;">Waitlist members are first in line.</p>
            
            <p style="margin-bottom: 16px;">Keep an eye on your inbox.</p>
            
            <p style="margin-top: 40px; color: #404040;">Stay focused.<br><strong>The Apex Team</strong></p>
        </div>
        """
        
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": email_address,
            "subject": subject,
            "html": html_content
        })
        logging.info(f"Welcome email sent to {email_address}")
    except Exception as e:
        logging.error(f"Failed to send welcome email to {email_address}: {e}")

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

# ============================
# Resend Email Endpoints
# ============================

@app.post("/send-test-email")
def send_test_email():
    """
    TASK 1 — TEST ENDPOINT: 
    Sends a test email to the first person on the waitlist.
    """
    try:
        # Fetch the first person on the waitlist
        entries = crud.get_all_waitlist_entries(skip=0, limit=1)
        if not entries:
            raise HTTPException(status_code=404, detail="No emails found in waitlist database.")
        
        target_email = entries[0]["email"]
        
        params = {
            "from": FROM_EMAIL,
            "to": target_email,
            "subject": "Test email - Resend is working!",
            "html": "<strong>It works!</strong> Resend is successfully integrated with Apex."
        }
        
        email = resend.Emails.send(params)
        return {"status": "success", "message": f"Test email sent to {target_email}", "id": email["id"]}
    
    except Exception as e:
        logging.error(f"Error in send_test_email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# MAIN BLAST — only call this when ready to send to everyone
@app.post("/send-waitlist-email")
def trigger_waitlist_blast(background_tasks: BackgroundTasks):
    """
    TASK 2 — WAITLIST BLAST ENDPOINT:
    Fetches all emails from Supabase and sends a blast in background.
    """
    try:
        entries = crud.get_all_waitlist_entries(skip=0, limit=2000)
        if not entries:
            return {"message": "No emails to send to."}

        background_tasks.add_task(run_email_blast, entries)
        return {"status": "accepted", "message": f"Waitlist blast started for {len(entries)} recipients in the background."}

    except Exception as e:
        logging.error(f"Error triggering waitlist blast: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def run_email_blast(entries: list):
    """Actual logic for sending emails in background"""
    sent_count = 0
    batch_size = 50
    emails = [entry["email"] for entry in entries]
    
    # EDIT EMAIL CONTENT HERE
    subject = "You signed up. We didn't forget."
    
    # Brand Colors: Purple (#8B5CF6), Black (#0A0A0A), White (#FFFFFF)
    def get_html_body(first_name="there"):
        return f"""
        <div style="font-family: sans-serif; color: #0A0A0A; background-color: #FFFFFF; padding: 40px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #E5E5E5;">
            <p style="font-size: 16px; margin-bottom: 24px;">Hey {first_name},</p>
            
            <p style="margin-bottom: 16px;">You joined the <span style="color: #8B5CF6; font-weight: bold;">Apex</span> waitlist a while back.</p>
            
            <p style="margin-bottom: 16px;">We took longer than we should have to reach out. That's on us.</p>
            
            <p style="margin-bottom: 16px;">But we've been building — <strong>heads down, no shortcuts.</strong></p>
            
            <p style="margin-bottom: 16px;"><span style="color: #8B5CF6; font-weight: bold;">Apex</span> is a reading and learning platform built for students who want to <strong>actually understand</strong> what they study. No tab switching. No noise. Just you, your books, and every tool you need — in one place.</p>
            
            <p style="margin-bottom: 16px;"><span style="color: #8B5CF6;">AI explanations. Dictionary lookups. Educational videos. Smart highlights.</span> All inline. All instant.</p>
            
            <p style="margin-bottom: 16px;">Because you joined early, you're on the <span style="background-color: #8B5CF6; color: #FFFFFF; padding: 2px 6px; border-radius: 4px; font-weight: bold;">shortlist for our private beta</span> — a small group of students who will use Apex first and help shape what it becomes.</p>
            
            <p style="margin-bottom: 16px;">We'll be in touch with next steps soon.</p>
            
            <p style="margin-top: 40px; color: #404040;">Stay locked in.<br><strong>The Apex Team</strong></p>
        </div>
        """

    # Note: User requested BCC and [First Name]. 
    # To support [First Name], we must send individual emails. 
    # We will loop through and send one by one to allow personalization.
    for entry in entries:
        try:
            target_email = entry["email"]
            # Extraction logic: take part before @, split by delimiters, strip numbers
            raw_name = target_email.split('@')[0]
            name_part = raw_name.replace('.', ' ').replace('_', ' ').replace('-', ' ').split()[0].rstrip('0123456789')
            first_name = name_part.capitalize()
            
            resend.Emails.send({
                "from": FROM_EMAIL,
                "to": target_email,
                "subject": subject,
                "html": get_html_body(first_name)
            })
            sent_count += 1
            if sent_count % 10 == 0:
                logging.info(f"Blast progress: {sent_count} emails sent.")
                
        except Exception as e:
            logging.error(f"Failed to send blast email to {entry.get('email')}: {e}")
            continue

    logging.info(f"Waitlist blast completed. Total sent: {sent_count}")
