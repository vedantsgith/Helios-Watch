"""
Database Models — Helios-Watch Backend

SQLAlchemy ORM models. User model uses hashed_password (bcrypt) for JWT auth.
"""

import os
from pathlib import Path
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

# Load environment
env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./helios.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a database session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class User(Base):
    """
    User account model for Helios-Watch.

    Authentication: email + bcrypt-hashed password, JWT sessions.
    No OTP, no sessions table — stateless JWT via httpOnly cookies.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    email_alerts_enabled = Column(Boolean, default=False)
    alert_min_status = Column(String, default="M_CLASS_FLARE")


class AlertEvent(Base):
    """
    Alert Event model for Helios-Watch.
    Stores historical warnings triggered by the live NOAA data feed.
    """
    __tablename__ = "alert_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    status = Column(String, nullable=False)
    details = Column(String, nullable=False)
    flux = Column(Float, nullable=True)
    slope = Column(Float, nullable=True)


# Create tables on startup (idempotent — won't drop existing data)
Base.metadata.create_all(bind=engine)
