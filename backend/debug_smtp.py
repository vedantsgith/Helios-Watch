import smtplib
import ssl
import os
from dotenv import load_dotenv

load_dotenv()

user = os.getenv("EMAIL_USER")
password = os.getenv("EMAIL_PASS")

print(f"Testing with User: {user}")
# Mask password for logs
masked = (password[:2] + "*" * 10) if password else "None"
print(f"Testing with Pass: {masked}")

try:
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        print("Connected to Gmail...")
        server.login(user, password)
        print("✅ SUCCESS: Login verified!")
except Exception as e:
    print(f"❌ FAILED: {e}")
