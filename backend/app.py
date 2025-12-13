from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import asyncio
import json
import secrets
from datetime import datetime
from schemas import WSMessage
from fetcher import fetch_noaa_data
from simulator import generate_flare
from derivative_engine import HybridEngine  # NEW: Hybrid Layer
from pydantic import BaseModel, EmailStr
from brownie_auth.routes import router as brownie_router, send_alert_email
from models import SessionLocal, User  # For fetching users for alerts

# THIS IS THE MISSING LINE CAUSING YOUR ERROR
app = FastAPI()

# Register Brownie Auth Routes
app.include_router(brownie_router)

# Allow Frontend to talk to Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],  # Specific origins for cookies
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session Middleware (Required for Session-based Auth)
# max_age: Cookie lifetime in seconds (7 days = 604800 seconds)
app.add_middleware(
    SessionMiddleware, 
    secret_key="super-secret-brownie-key", 
    https_only=False,
    max_age=604800,  # 7 days - makes cookie persistent
    same_site="lax"  # Allows cookie to be sent on navigation
)



active_connections = set()
simulation_queue = []  # Stores fake points to be sent

is_simulating = False
hybrid_engine = HybridEngine() # Instantiate Hybrid Engine
data_cache = []  # Cache for historical data
last_alert_time = datetime.min  # For email debouncing

# --- AUTH STORAGE (In-Memory for Demo) ---
otp_store = {}  # {email: otp}

def generate_otp():
    return str(secrets.randbelow(1000000)).zfill(6)

def send_email_mock(email: str, otp: str):
    print(f"\n[EMAIL SERVICE] To: {email} | Subject: Your Login OTP | Body: {otp}\n")
    # In a real app, use SMTP or an API here.


# Global event for instant wake-up
update_event = asyncio.Event()

@app.get("/health")
async def health_check():
    return {"status": "online", "mode": "live"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept() # CRITICAL: MUST BE FIRST
    print(f"WebSocket connected: {websocket.client}")
    active_connections.add(websocket)

    try:
        # Send Initial 6-Hour History
        points = await fetch_noaa_data()
        if points:
            # We send a special 'history_update'
            msg = WSMessage(
                type="history_update", 
                payload={"history": [p.model_dump() for p in points]}
            )
            await websocket.send_text(msg.json())
            
            # --- HYBRID LAYER (Immediate Update) ---
            # Send initial calculus data so UI doesn't say "Loading..."
            calc_data = hybrid_engine.analyze(points)
            msg_calc = WSMessage(type="calculus_update", payload=calc_data)
            await websocket.send_text(msg_calc.json())

        # --- TELEMETRY HISTORY (Wind & Kp) ---
        from fetcher import fetch_telemetry_history
        telemetry_hist = await fetch_telemetry_history()
        msg_telem_hist = WSMessage(type="telemetry_history_update", payload=telemetry_hist)
        await websocket.send_text(msg_telem_hist.json())

    except Exception as e:
        print(f"Error sending initial data: {e}")

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

async def heartbeat():
    global is_simulating, simulation_queue, update_event, data_cache, last_alert_time

    while True:
        if active_connections:
            # MODE 1: SIMULATION
            if is_simulating and simulation_queue:
                item = simulation_queue.pop(0)
                
                # Check for Telemetry Dict (Wind/Kp/Proton)
                if isinstance(item, dict) and item.get("type") == "telemetry_sim":
                    # Send as Telemetry Update
                    msg = WSMessage(type="telemetry_update", payload=item)
                else:
                    # Send as Flux Data Update (SolarPoint object)
                    msg = WSMessage(type="data_update", payload=item.model_dump())

                for connection in list(active_connections):
                    try:
                        await connection.send_text(msg.json())
                    except:
                        active_connections.remove(connection)

                if not simulation_queue:
                    is_simulating = False

                # Fast updates for smooth animation (adjusted to 300ms as requested)
                # Fast updates for smooth animation (adjusted to 300ms as requested)
                # ALERT LOGIC (Simulation Mode)
                # ALERT LOGIC (Simulation Mode)
                # Check EVERY item (Flux List OR Telemetry Dict)
                # if not isinstance(item, dict):
                #     calc_data = hybrid_engine.analyze([item]) 
                # else:
                #     calc_data = hybrid_engine.analyze(item)
                
                # SIMPLIFIED: Just pass it. The Engine now handles both.
                calc_data = hybrid_engine.analyze(item if isinstance(item, dict) else [item])

                if calc_data['is_warning']:
                        now = datetime.utcnow()
                        if (now - last_alert_time).total_seconds() > 10:
                            last_alert_time = now
                            print(f"⚠ THREAT DETECTED (SIM): {calc_data['status']} - SENDING ALERTS...")
                            import threading
                            def dispatch_alerts():
                                try:
                                    db = SessionLocal()
                                    users = db.query(User).all()
                                    if not users: print("⚠ No users found in DB to alert!")
                                    for user in users:
                                        send_alert_email(user.email, calc_data)
                                        print(f"✔ Alert sent to {user.email}")
                                    db.close()
                                except Exception as e:
                                    print(f"Alert Dispatch Error: {e}")
                            threading.Thread(target=dispatch_alerts).start()

                await asyncio.sleep(0.3)
                continue

            # MODE 2: LIVE NOAA
            elif not is_simulating:
                # 1. Fetch Flux Chart Data
                points = await fetch_noaa_data()
                if points:
                    # Update cache
                    data_cache = points
                    latest = points[-1]
                    msg = WSMessage(type="data_update", payload=latest.model_dump())
                    
                    # --- HYBRID LAYER ---
                    # Calculate dFlux/dt + Thresholds
                    calc_data = hybrid_engine.analyze(points)
                    msg_calc = WSMessage(type="calculus_update", payload=calc_data)
                    
                    for connection in list(active_connections):
                        try:
                            await connection.send_text(msg.json())
                            await connection.send_text(msg_calc.json())
                        except:
                            active_connections.remove(connection)

                # 2. Fetch Detailed Telemetry (Physics View)
                from fetcher import fetch_telemetry, fetch_solar_regions
                
                # Parallel Fetch
                telemetry_data, active_regions = await asyncio.gather(
                    fetch_telemetry(),
                    fetch_solar_regions()
                )
                
                # Send Telemetry
                msg_telemetry = WSMessage(type="telemetry_update", payload=telemetry_data)
                
                # Send Regions
                msg_regions = WSMessage(type="regions_update", payload={"regions": active_regions})

                for connection in list(active_connections):
                    try:
                        await connection.send_text(msg_telemetry.json())
                        await connection.send_text(msg_regions.json())
                    except:
                        pass

                # Wait 60 seconds OR until an event is set (instant wake-up)
                try:
                    await asyncio.wait_for(update_event.wait(), timeout=60.0)
                    update_event.clear()  # Reset event after waking up
                except asyncio.TimeoutError:
                    pass  # Just a normal timeout, loop again



        else:
            await asyncio.sleep(1)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(heartbeat())

class SimulationRequest(BaseModel):
    type: str  # "M", "X" (for Flux) OR "wind", "kp", "proton" (for Metrics)
    duration: int
    event_type: str = "flux" # "flux", "wind", "kp", "proton"

@app.post("/simulate")
async def trigger_simulation(req: SimulationRequest):
    global is_simulating, simulation_queue, update_event

    # Generate the fake points (Flux Objects OR Telemetry Dicts)
    points = generate_flare(req.type, req.duration, req.event_type)

    # Add to queue
    simulation_queue.extend(points)
    is_simulating = True
    
    # WAKE UP THE LOOP INSTANTLY!
    update_event.set()

    return {"status": "started", "points": len(points)}

# --- AUTH ENDPOINTS ---

class LoginRequest(BaseModel):
    email: EmailStr

class VerifyRequest(BaseModel):
    email: EmailStr
    otp: str

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    # 1. Generate OTP
    otp = generate_otp()
    
    # 2. Store it
    otp_store[req.email] = otp
    
    # 3. Send it
    send_email_mock(req.email, otp)
    
    return {"message": "OTP sent to email"}

@app.post("/api/auth/verify")
async def verify(req: VerifyRequest, request: Request):
    # 1. Check if OTP matches
    stored_otp = otp_store.get(req.email)
    
    if not stored_otp:
         raise HTTPException(status_code=400, detail="No OTP request found for this email")
    
    if stored_otp != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    # 2. Success! Clear OTP
    del otp_store[req.email]
    
    # 3. Create Session
    request.session["user"] = req.email
    
    return {"message": "Login successful", "user": req.email}

@app.post("/api/auth/logout")
async def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out"}

@app.get("/api/auth/me")
async def get_current_user(request: Request):
    user = request.session.get("user")
    print(f"[SESSION DEBUG] /me called. Session Keys: {request.session.keys()}")
    print(f"[SESSION DEBUG] User in session: {user}")
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Return user object with id and email (compatible with brownie auth)
    if isinstance(user, dict):
        return {"user": user}
    # Legacy string format (email only)
    return {"user": {"id": 0, "email": user}}
