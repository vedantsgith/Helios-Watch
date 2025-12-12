"""
Brownie Auth Routes - Session-based OTP Login and Email Verification

Framework: FastAPI
Module: brownie_auth.routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import smtplib
import ssl
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from models import get_db, save_otp_to_user, verify_otp, User

# Load environment variables from .env file
from pathlib import Path
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
print(f"DEBUG: Loading .env from {env_path}")
print(f"DEBUG: Loaded EMAIL_USER: {os.getenv('EMAIL_USER')}")

# Initialize FastAPI Router
router = APIRouter(
    prefix="/api/brownie",
    tags=["brownie-auth"],
)

# ============ REQUEST SCHEMAS ============

class EmailRequest(BaseModel):
    """Schema for email OTP request."""
    email: EmailStr


class OTPVerifyRequest(BaseModel):
    """Schema for OTP verification."""
    email: EmailStr
    otp_code: str


# ============ EMAIL CONFIGURATION ============

GMAIL_SMTP_SERVER = "smtp.gmail.com"
GMAIL_SMTP_PORT = 465
EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASS = os.getenv("EMAIL_PASS", "")


def send_otp_email(email: str, otp_code: str) -> dict:
    """
    Send OTP via Gmail SMTP with SSL.

    Args:
        email: Recipient email address
        otp_code: The 6-digit OTP code

    Returns:
        dict: {'success': bool, 'message': str}
    """
    # FALLBACK: Print OTP to console if email credentials not configured
    print(f"DEBUG: EMAIL_USER='{EMAIL_USER}', EMAIL_PASS set={'Yes' if EMAIL_PASS else 'No'}")
    if not EMAIL_USER or not EMAIL_PASS:
        print(f"\n{'='*60}")
        print(f"📧 OTP EMAIL (Console Mode - No SMTP Configured)")
        print(f"{'='*60}")
        print(f"To: {email}")
        print(f"Subject: Your Helios Watch OTP Code")
        print(f"\nYour OTP Code: {otp_code}")
        print(f"\nThis code expires in 5 minutes.")
        print(f"{'='*60}\n")
        return {
            'success': True,
            'message': f'OTP sent to console. Check your backend terminal for the code.'
        }

    try:
        # Create SSL context
        context = ssl.create_default_context()

        # Connect to Gmail SMTP server with SSL
        with smtplib.SMTP_SSL(GMAIL_SMTP_SERVER, GMAIL_SMTP_PORT, context=context) as server:
            # Login to Gmail
            server.login(EMAIL_USER, EMAIL_PASS)

            # Compose email with proper headers
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart()
            msg['From'] = EMAIL_USER
            msg['To'] = email
            msg['Subject'] = "Your Helios Watch OTP Code"

            body = f"""Hello,

Your One-Time Password (OTP) for Helios Watch login is:

{otp_code}

This code will expire in 5 minutes.

Do not share this code with anyone.

Best regards,
Helios Watch Team
"""
            msg.attach(MIMEText(body, 'plain'))

            # Send email
            server.send_message(msg)

        print(f"✅ OTP email sent successfully to {email}")
        return {
            'success': True,
            'message': f'OTP sent successfully to {email}'
        }

    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ SMTP Authentication Error: {str(e)}")
        return {
            'success': False,
            'message': 'SMTP authentication failed. Check your Gmail App Password.'
        }
    except smtplib.SMTPException as e:
        print(f"❌ SMTP Error: {str(e)}")
        return {
            'success': False,
            'message': f'SMTP error: {str(e)}'
        }
    except Exception as e:
        print(f"❌ Email Error: {str(e)}")
        return {
            'success': False,
            'message': f'Error sending email: {str(e)}'
        }


# ============ ENDPOINTS ============

@router.post("/request-otp")
def request_otp(request: EmailRequest, db: Session = Depends(get_db)):
    """
    Request an OTP for email verification.

    1. Generates a 6-digit OTP
    2. Saves it to the database with 5-minute expiration
    3. Sends the OTP via Gmail SMTP

    Args:
        request: EmailRequest with user's email
        db: Database session (injected by FastAPI)

    Returns:
        dict: Success/failure response
    """
    email = request.email.lower()

    # Save OTP to database
    otp_result = save_otp_to_user(db, email, otp_duration_minutes=5)

    if not otp_result['success']:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=otp_result['message']
        )

    # Send OTP via email
    otp_code = otp_result['otp_code']
    email_result = send_otp_email(email, otp_code)

    if not email_result['success']:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=email_result['message']
        )

    return {
        'success': True,
        'message': f'OTP sent to {email}. Check your inbox.'
    }


@router.post("/verify-otp")
def verify_otp_endpoint(request: OTPVerifyRequest, req: Request, db: Session = Depends(get_db)):
    """
    Verify the OTP code provided by the user and initialize a session.

    Args:
        request: OTPVerifyRequest with email and otp_code
        req: FastAPI Request object for session management
        db: Database session (injected by FastAPI)

    Returns:
        dict: Success/failure response with user info
    """
    email = request.email.lower()
    otp_code = request.otp_code.strip()

    # Get user from database
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='User not found'
        )

    # Verify OTP
    result = verify_otp(db, email, otp_code)

    if not result['success']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['message']
        )

    # CRITICAL: Initialize server-side session compatible with existing auth
    req.session['user_id'] = user.id
    req.session['email'] = user.email
    req.session['user'] = {
        'id': user.id,
        'email': user.email
    }

    return {
        'success': True,
        'message': 'OTP verified successfully. Session created.',
        'user_id': user.id,
        'email': user.email
    }
