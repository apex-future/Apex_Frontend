from pydantic import BaseModel, EmailStr
from datetime import datetime

# Schema for creating waitlist entry
class WaitlistCreate(BaseModel):
    email: EmailStr

# Schema for response
class WaitlistResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True  # Allows SQLAlchemy model conversion