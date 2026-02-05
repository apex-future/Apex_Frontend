from app.database import supabase

# ==============================
# Supabase CRUD functions
# ==============================

TABLE_NAME = "waitlist"   # ← Use lowercase unless you created quoted table


def create_waitlist_entry(email: str):
    """Add email to waitlist using Supabase"""

    response = supabase.table(TABLE_NAME).insert({
        "email": email
    }).execute()

    # Debug logging (helps in prod logs)
    print("INSERT RESPONSE:", response)

    # Handle Supabase errors properly
    if getattr(response, "error", None):
        print("SUPABASE INSERT ERROR:", response.error)
        return None

    if response.data:
        return response.data[0]

    return None


def get_waitlist_entry_by_email(email: str):
    """Check if email already exists in Supabase"""

    response = supabase.table(TABLE_NAME)\
        .select("*")\
        .eq("email", email)\
        .execute()

    if getattr(response, "error", None):
        print("SUPABASE SELECT ERROR:", response.error)
        return None

    if response.data:
        return response.data[0]

    return None


def get_all_waitlist_entries(skip: int = 0, limit: int = 100):
    """Get all waitlist entries from Supabase"""

    response = supabase.table(TABLE_NAME)\
        .select("*")\
        .range(skip, skip + limit - 1)\
        .execute()

    if getattr(response, "error", None):
        print("SUPABASE FETCH ERROR:", response.error)
        return []

    return response.data or []


def get_waitlist_count():
    """Get total number of waitlist entries"""

    response = supabase.table(TABLE_NAME)\
        .select("*", count="exact")\
        .execute()

    if getattr(response, "error", None):
        print("SUPABASE COUNT ERROR:", response.error)
        return 0

    return response.count or 0