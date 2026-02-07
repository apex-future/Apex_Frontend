from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# Schema for creating waitlist entry
class WaitlistCreate(BaseModel):
    email: EmailStr

# Schema for response from Supabase
class WaitlistResponse(BaseModel):
    id: int
    email: str
    created_at: Optional[datetime] = None  # Supabase returns ISO string, will be auto-parsed

    class Config:
        # Accept dicts directly (from Supabase) and parse datetime strings
        orm_mode = True
        arbitrary_types_allowed = True