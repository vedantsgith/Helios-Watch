"""
Database Models - SQLAlchemy ORM Models

Defines the User model with OTP support for session-based authentication.
"""

from datetime import datetime, timedelta
from sqlalchemy import Column, String, DateTime, Integer, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import secrets
import os

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./brownie.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for FastAPI to inject database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class User(Base):
    """User model with OTP fields for email verification."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False, index=True)
    otp_code = Column(String, nullable=True)  # 6-digit OTP
    otp_expiry = Column(DateTime, nullable=True)  # Expiration timestamp



class LoginHistory(Base):
    """Log of user login events."""
    __tablename__ = "login_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, index=True) # Foreign Key logic or simple integer reference
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, nullable=True)


# Create tables if they don't exist (Persistence Enabled)
# Base.metadata.drop_all(bind=engine) # DISABLED: To preserve users/history
Base.metadata.create_all(bind=engine)


# ============ HELPER FUNCTION ============

def save_otp_to_user(session: Session, email: str, otp_duration_minutes: int = 5) -> dict:
    """
    Generate a 6-digit OTP and save it to a user with expiration time.

    Args:
        session: SQLAlchemy session object
        email: User's email address
        otp_duration_minutes: How long OTP is valid (default: 5 minutes)

    Returns:
        dict: {
            'success': bool,
            'otp_code': str (only if success),
            'expiry': datetime (only if success),
            'message': str
        }
    """
    try:
        # Generate 6-digit OTP
        otp_code = str(secrets.randbelow(1000000)).zfill(6)
        
        # Calculate expiration time (now + 5 minutes)
        otp_expiry = datetime.utcnow() + timedelta(minutes=otp_duration_minutes)
        
        # Find or create user
        user = session.query(User).filter(User.email == email).first()
        
        if not user:
            user = User(email=email)
            session.add(user)
        
        # Update OTP fields
        user.otp_code = otp_code
        user.otp_expiry = otp_expiry
        
        # Commit to database
        session.commit()
        
        return {
            'success': True,
            'otp_code': otp_code,
            'expiry': otp_expiry,
            'message': f'OTP sent to {email}. Valid for {otp_duration_minutes} minutes.'
        }
    
    except Exception as e:
        session.rollback()
        return {
            'success': False,
            'message': f'Error saving OTP: {str(e)}'
        }


def verify_otp(session: Session, email: str, otp_code: str) -> dict:
    """
    Verify if the provided OTP matches and hasn't expired.

    Args:
        session: SQLAlchemy session object
        email: User's email address
        otp_code: The OTP code to verify

    Returns:
        dict: {
            'success': bool,
            'message': str
        }
    """
    try:
        user = session.query(User).filter(User.email == email).first()
        
        if not user:
            return {'success': False, 'message': 'User not found'}
        
        if not user.otp_code:
            return {'success': False, 'message': 'No OTP generated for this user'}
        
        if user.otp_code != otp_code:
            return {'success': False, 'message': 'Incorrect OTP code'}
        
        if user.otp_expiry and datetime.utcnow() > user.otp_expiry:
            return {'success': False, 'message': 'OTP has expired'}
        
        # OTP is valid, clear it
        user.otp_code = None
        user.otp_expiry = None
        session.commit()
        
        return {'success': True, 'message': 'OTP verified successfully'}
    
    except Exception as e:
        session.rollback()
        return {'success': False, 'message': f'Error verifying OTP: {str(e)}'}

def log_user_login(session: Session, user_id: int, ip_address: str = "0.0.0.0"):
    """
    Log a successful login event.
    """
    try:
        entry = LoginHistory(user_id=user_id, ip_address=ip_address)
        session.add(entry)
        session.commit()
        print(f"Logged login for User {user_id} from {ip_address}")
    except Exception as e:
        print(f"Failed to log login: {e}")

