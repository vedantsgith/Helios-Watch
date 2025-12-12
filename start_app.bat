@echo off
echo Starting Helios-Watch System...

:: Start Backend
start "Helios-Watch Backend" cmd /k "cd backend && echo Installing Python dependencies... && pip install -r requirements.txt && echo Starting Backend... && uvicorn app:app --reload --port 8001"

:: Start Frontend
start "Helios-Watch Frontend" cmd /k "cd frontend && echo Installing Node dependencies... && npm install && echo Starting Frontend... && npm run dev"

echo.
echo ===================================================
echo  System Initiated. 
echo  Please wait for servers to start.
echo  Once 'Vite' shows a Local URL, open it in your browser.
echo  Typically: http://localhost:5173
echo ===================================================
pause
