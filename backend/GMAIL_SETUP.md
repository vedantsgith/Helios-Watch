# Gmail SMTP Setup for Brownie Challenge OTP

## Step 1: Enable 2-Factor Authentication on Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", enable **2-Step Verification**
4. Follow the prompts to set it up with your phone

## Step 2: Generate App Password

1. After 2FA is enabled, go back to **Security**
2. Under "Signing in to Google", click **App passwords** (or go directly to https://myaccount.google.com/apppasswords)
3. You might need to sign in again
4. In the "Select app" dropdown, choose **Mail**
5. In the "Select device" dropdown, choose **Windows Computer** (or Other if not listed)
6. Click **Generate**
7. Google will show you a 16-character password (like `abcd efgh ijkl mnop`)
8. **COPY THIS PASSWORD** - you won't see it again!

## Step 3: Set Environment Variables

### Option A: For Current PowerShell Session Only
```powershell
$env:EMAIL_USER="your-gmail@gmail.com"
$env:EMAIL_PASS="abcdefghijklmnop"  # Remove spaces from App Password
```

Then restart the backend:
```powershell
cd c:/Users/bhard/Helios-Watch/backend
C:/Users/bhard/Helios-Watch/.venv/Scripts/uvicorn app:app --reload --host 127.0.0.1 --port 8001
```

### Option B: Create a `.env` file (Recommended)

1. Create a file named `.env` in the `backend` folder:
```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=abcdefghijklmnop
DATABASE_URL=sqlite:///./brownie.db
```

2. Install `python-dotenv`:
```powershell
C:/Users/bhard/Helios-Watch/.venv/Scripts/pip install python-dotenv
```

3. Update `brownie_auth/routes.py` at the top:
```python
from dotenv import load_dotenv
load_dotenv()  # Add this line before other imports
```

4. Restart backend

## Step 4: Test the Setup

1. Go to http://localhost:5173/brownie-login
2. Enter your real Gmail address
3. Click "Send OTP"
4. Check your Gmail inbox (and spam folder if needed)
5. Enter the 6-digit code
6. Click "Login"

## Troubleshooting

**"SMTP authentication failed"**
- Double-check your Gmail address
- Make sure you copied the App Password correctly (no spaces)
- Ensure 2FA is enabled on your Google Account

**"Less secure app access" error**
- Use App Password instead of regular password
- App Passwords only work if 2FA is enabled

**Email not arriving**
- Check spam/junk folder
- Verify the recipient email in the backend terminal logs
- Check if Gmail blocked the email (check your "Sent" folder)

## Security Notes

- Never commit `.env` file to git (add it to `.gitignore`)
- App Passwords are specific to each app/device
- You can revoke App Passwords anytime from your Google Account
- The 16-character password is NOT your regular Gmail password
