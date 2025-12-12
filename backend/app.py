from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from datetime import datetime
from schemas import WSMessage
from fetcher import fetch_noaa_data
from simulator import generate_flare
from pydantic import BaseModel

# THIS IS THE MISSING LINE CAUSING YOUR ERROR
app = FastAPI()

# Allow Frontend to talk to Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

active_connections = set()
simulation_queue = []  # Stores fake points to be sent
is_simulating = False

# Global event for instant wake-up
update_event = asyncio.Event()

@app.get("/health")
async def health_check():
    return {"status": "online", "mode": "live"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    
    # Send Initial 6-Hour History
    try:
        points = await fetch_noaa_data()
        if points:
            # We send a special 'history_update'
            msg = WSMessage(
                type="history_update", 
                payload={"history": [p.model_dump() for p in points]}
            )
            await websocket.send_text(msg.json())
    except Exception as e:
        print(f"Error sending initial data: {e}")

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

async def heartbeat():
    global is_simulating, simulation_queue, update_event

    while True:
        if active_connections:
            # MODE 1: SIMULATION
            if is_simulating and simulation_queue:
                point = simulation_queue.pop(0)
                msg = WSMessage(type="data_update", payload=point.model_dump())

                for connection in list(active_connections):
                    try:
                        await connection.send_text(msg.json())
                    except:
                        active_connections.remove(connection)

                if not simulation_queue:
                    is_simulating = False

                # Fast updates for smooth animation
                await asyncio.sleep(0.1)
                continue

            # MODE 2: LIVE NOAA
            elif not is_simulating:
                points = await fetch_noaa_data()
                if points:
                    latest = points[-1]
                    msg = WSMessage(type="data_update", payload=latest.model_dump())
                    for connection in list(active_connections):
                        try:
                            await connection.send_text(msg.json())
                        except:
                            active_connections.remove(connection)

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
    type: str  # "M" or "X"
    duration: int

@app.post("/simulate")
async def trigger_simulation(req: SimulationRequest):
    global is_simulating, simulation_queue, update_event

    # Generate the fake points
    points = generate_flare(req.type, req.duration)

    # Add to queue
    simulation_queue.extend(points)
    is_simulating = True
    
    # WAKE UP THE LOOP INSTANTLY!
    update_event.set()

    return {"status": "started", "points": len(points)}