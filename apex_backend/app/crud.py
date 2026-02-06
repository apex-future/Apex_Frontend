from app.database import supabase

# ==============================
# CONFIG
# ==============================
TABLE_NAME = "waitlist"   # Must match Supabase table exactly


# ==============================
# CREATE
# ==============================
def create_waitlist_entry(email: str):
    """Add email to waitlist using Supabase"""

    try:
        response = (
            supabase
            .table(TABLE_NAME)
            .insert({"email": email})
            .execute()
        )

        print("INSERT RESPONSE:", response)

        # Handle errors
        if hasattr(response, "error") and response.error:
            print("SUPABASE INSERT ERROR:", response.error)
            return None

        if response.data:
            return response.data[0]

        print("INSERT FAILED — No data returned")
        return None

    except Exception as e:
        print("EXCEPTION DURING INSERT:", str(e))
        return None


# ==============================
# READ ONE
# ==============================
def get_waitlist_entry_by_email(email: str):
    """Check if email already exists"""

    try:
        response = (
            supabase
            .table(TABLE_NAME)
            .select("*")
            .eq("email", email)
            .execute()
        )

        if hasattr(response, "error") and response.error:
            print("SUPABASE SELECT ERROR:", response.error)
            return None

        if response.data:
            return response.data[0]

        return None

    except Exception as e:
        print("EXCEPTION DURING SELECT:", str(e))
        return None


# ==============================
# READ ALL
# ==============================
def get_all_waitlist_entries(skip: int = 0, limit: int = 100):
    try:
        response = (
            supabase
            .table(TABLE_NAME)
            .select("*")
            .range(skip, skip + limit - 1)
            .execute()
        )

        if hasattr(response, "error") and response.error:
            print("SUPABASE FETCH ERROR:", response.error)
            return []

        return response.data or []

    except Exception as e:
        print("EXCEPTION DURING FETCH:", str(e))
        return []


# ==============================
# COUNT
# ==============================
def get_waitlist_count():
    try:
        response = (
            supabase
            .table(TABLE_NAME)
            .select("*", count="exact")
            .execute()
        )

        if hasattr(response, "error") and response.error:
            print("SUPABASE COUNT ERROR:", response.error)
            return 0

        return response.count or 0

    except Exception as e:
        print("EXCEPTION DURING COUNT:", str(e))
        return 0