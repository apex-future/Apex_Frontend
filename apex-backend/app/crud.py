from app.database import supabase

# ==============================
# Supabase CRUD functions
# ==============================

def create_waitlist_entry(email: str):
    """Add email to waitlist using Supabase"""
    table_name = "waitlist"
    response = supabase.table(table_name).insert({"email": email}).execute()

    if response.status_code in (200, 201):
        return response.data[0]
    return None

def get_waitlist_entry_by_email(email: str):
    """Check if email already exists in Supabase"""
    table_name = "Waitlist"
    response = supabase.table(table_name).select("*").eq("email", email).execute()
    if response.data:
        return response.data[0]
    return None

def get_all_waitlist_entries(skip: int = 0, limit: int = 100):
    """Get all waitlist entries from Supabase"""
    table_name = "Waitlist"
    response = supabase.table(table_name).select("*").range(skip, skip + limit - 1).execute()
    return response.data or []

def get_waitlist_count():
    """Get total number of waitlist entries"""
    response = supabase.table("Waitlist").select("*", count="exact").execute()
    return response.count or 0