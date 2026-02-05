from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app import models, schemas

def create_waitlist_entry(db: Session, email: str):
    """Add email to waitlist"""
    db_entry = models.Waitlist(email=email)
    
    try:
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except IntegrityError:
        db.rollback()
        return None  # Email already exists

def get_waitlist_entry_by_email(db: Session, email: str):
    """Check if email already exists"""
    return db.query(models.Waitlist).filter(models.Waitlist.email == email).first()

def get_all_waitlist_entries(db: Session, skip: int = 0, limit: int = 100):
    """Get all waitlist entries (for admin)"""
    return db.query(models.Waitlist).offset(skip).limit(limit).all()

def get_waitlist_count(db: Session):
    """Get total number of waitlist entries"""
    return db.query(models.Waitlist).count()