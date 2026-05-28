"""
Solar API Routes — Helios-Watch Backend

WebSocket live feed, heartbeat task, simulation trigger, and health check.
Moved from: backend/app.py (solar/WebSocket sections only)
"""

import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.models.schemas import WSMessage, SimulationRequest
from app.models.db_models import get_db, SessionLocal, AlertEvent
from app.services.noaa_service import fetch_noaa_data, fetch_telemetry, fetch_solar_regions, fetch_telemetry_history
from app.services.anomaly_engine import HybridEngine
from app.services.simulator_service import generate_flare

router = APIRouter(tags=["solar"])

# ─── State ────────────────────────────────────────────────────────────────────

active_connections: set[WebSocket] = set()
simulation_queue: list = []
is_simulating: bool = False
hybrid_engine = HybridEngine()
data_cache: list = []
update_event = asyncio.Event()
last_logged_status = "STABLE"


async def save_and_broadcast_alert(status: str, details: str, flux: float, slope: float):
    """Saves a new warning event to the database and broadcasts it to all active WebSockets."""
    db = SessionLocal()
    try:
        event = AlertEvent(
            timestamp=datetime.now(timezone.utc),
            status=status,
            details=details,
            flux=flux,
            slope=slope
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        
        msg = WSMessage(
            type="new_alert",
            payload={
                "id": event.id,
                "timestamp": event.timestamp.isoformat().replace("+00:00", "Z"),
                "status": event.status,
                "details": event.details,
                "flux": event.flux,
                "slope": event.slope
            }
        )
        
        # Trigger email alerts in the background so it doesn't block the main event loop
        asyncio.create_task(asyncio.to_thread(send_email_notifications, status, details, flux, slope))

        for conn in list(active_connections):
            try:
                await conn.send_text(msg.model_dump_json())
            except Exception:
                active_connections.discard(conn)
    except Exception as e:
        print(f"[ERROR] Failed to save/broadcast alert event: {e}")
    finally:
        db.close()


def send_email_notifications(status: str, details: str, flux: float, slope: float):
    """Sends background email notifications to users matching alert criteria."""
    import os
    import smtplib
    import ssl
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    from app.models.db_models import User

    sender_email = os.getenv("EMAIL_USER")
    sender_password = os.getenv("EMAIL_PASS")

    if not sender_email or not sender_password:
        print("[WARN] SMTP Email credentials missing in .env — skipping alerts.")
        return

    db = SessionLocal()
    try:
        # Determine target threshold statuses
        target_statuses = []
        if status == "X_CLASS_FLARE":
            target_statuses = ["X_CLASS_FLARE", "M_CLASS_FLARE", "RAPID_INTENSIFICATION"]
        elif status == "M_CLASS_FLARE":
            target_statuses = ["M_CLASS_FLARE", "RAPID_INTENSIFICATION"]
        elif status == "RAPID_INTENSIFICATION":
            target_statuses = ["RAPID_INTENSIFICATION"]

        users = db.query(User).filter(
            User.email_alerts_enabled == True,
            User.alert_min_status.in_(target_statuses)
        ).all()

        if not users:
            return

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(sender_email, sender_password)

            for user in users:
                try:
                    # Construct email message
                    message = MIMEMultipart("alternative")
                    message["Subject"] = f"⚠️ HELIOS-WATCH: Solar Anomaly Alert ({status.replace('_', ' ')})"
                    message["From"] = f"Helios-Watch Alerts <{sender_email}>"
                    message["To"] = user.email

                    text_content = f"""
                    HELIOS-WATCH: SOLAR ANOMALY DETECTED

                    Status: {status.replace('_', ' ')}
                    Details: {details}
                    Peak Flux: {flux:.2e} W/m²
                    Rate of Change (dFlux/dt): {slope:.1e} W/m²/min

                    This is an automated alert based on live satellite data from NOAA SWPC.
                    Access the command center dashboard: http://localhost:5173/
                    """

                    html_content = f"""
                    <html>
                    <body style="font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 20px;">
                        <h2 style="color: #f97316; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">
                            ⚠️ HELIOS-WATCH ALERT
                        </h2>
                        <p style="font-size: 16px; font-weight: bold; color: #ef4444;">
                            SOLAR ANOMALY DETECTED: {status.replace('_', ' ')}
                        </p>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <tr style="background-color: #111;">
                                <td style="padding: 10px; border: 1px solid #333; font-weight: bold; color: #f59e0b;">Status</td>
                                <td style="padding: 10px; border: 1px solid #333; color: #fff;">{status.replace('_', ' ')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #333; font-weight: bold; color: #f59e0b;">Details</td>
                                <td style="padding: 10px; border: 1px solid #333; color: #fff;">{details}</td>
                            </tr>
                            <tr style="background-color: #111;">
                                <td style="padding: 10px; border: 1px solid #333; font-weight: bold; color: #f59e0b;">Peak Flux</td>
                                <td style="padding: 10px; border: 1px solid #333; color: #fff; font-family: monospace;">{flux:.2e} W/m²</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #333; font-weight: bold; color: #f59e0b;">Rate of Change</td>
                                <td style="padding: 10px; border: 1px solid #333; color: #fff; font-family: monospace;">{slope:.1e} W/m²/min</td>
                            </tr>
                        </table>
                        <p style="font-size: 12px; color: #666; margin-top: 25px;">
                            This is an automated alert based on live NOAA Space Weather Prediction Center feeds.
                            To configure alerts, update your preferences in the dashboard.
                        </p>
                    </body>
                    </html>
                    """

                    message.attach(MIMEText(text_content, "plain"))
                    message.attach(MIMEText(html_content, "html"))

                    server.sendmail(sender_email, user.email, message.as_string())
                    print(f"[SMTP] Dispatched email alert to: {user.email}")
                except Exception as e:
                    print(f"[ERROR] Failed to send email to {user.email}: {e}")

    except Exception as e:
        print(f"[ERROR] SMTP notification dispatcher error: {e}")
    finally:
        db.close()


# ─── Health ───────────────────────────────────────────────────────────────────

@router.get("/health")
async def health_check():
    return {"status": "online", "mode": "live"}


@router.get("/alerts/history")
def get_alerts_history(db: Session = Depends(get_db), limit: int = 50):
    events = db.query(AlertEvent).order_by(AlertEvent.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat().replace("+00:00", "Z") if e.timestamp else None,
            "status": e.status,
            "details": e.details,
            "flux": e.flux,
            "slope": e.slope
        }
        for e in events
    ]


# ─── WebSocket ────────────────────────────────────────────────────────────────

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print(f"WebSocket connected: {websocket.client}")
    active_connections.add(websocket)

    try:
        # Send initial 24-hour history on connect
        points = await fetch_noaa_data()
        if points:
            msg = WSMessage(
                type="history_update",
                payload={"history": [p.model_dump() for p in points]},
            )
            await websocket.send_text(msg.model_dump_json())

            # Send initial calculus state immediately (avoids "Loading..." on startup)
            calc_data = hybrid_engine.analyze(points)
            msg_calc = WSMessage(type="calculus_update", payload=calc_data)
            await websocket.send_text(msg_calc.model_dump_json())

        # Send telemetry history (wind, kp, proton) for graph initialization
        telemetry_hist = await fetch_telemetry_history()
        msg_telem_hist = WSMessage(type="telemetry_history_update", payload=telemetry_hist)
        await websocket.send_text(msg_telem_hist.model_dump_json())

    except Exception as e:
        print(f"Error sending initial data: {e}")

    try:
        import json
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    pong_msg = {
                        "type": "pong",
                        "payload": msg.get("payload", {})
                    }
                    await websocket.send_json(pong_msg)
            except Exception:
                pass
    except WebSocketDisconnect:
        active_connections.discard(websocket)


# ─── Heartbeat ────────────────────────────────────────────────────────────────

async def heartbeat():
    """Background task: live NOAA polling + simulation playback."""
    global is_simulating, simulation_queue, data_cache, last_logged_status

    while True:
        if not active_connections:
            await asyncio.sleep(1)
            continue

        # MODE 1: SIMULATION PLAYBACK
        if is_simulating and simulation_queue:
            item = simulation_queue.pop(0)

            if isinstance(item, dict) and item.get("type") == "telemetry_sim":
                msg = WSMessage(type="telemetry_update", payload=item)
            else:
                msg = WSMessage(type="data_update", payload=item.model_dump())

            for conn in list(active_connections):
                try:
                    await conn.send_text(msg.model_dump_json())
                except Exception:
                    active_connections.discard(conn)

            if not simulation_queue:
                is_simulating = False

            await asyncio.sleep(0.3)  # 300ms tick for smooth animation
            continue

        # MODE 2: LIVE NOAA POLLING
        points = await fetch_noaa_data()
        if points:
            data_cache = points
            latest = points[-1]
            msg = WSMessage(type="data_update", payload=latest.model_dump())

            # Hybrid engine analysis
            calc_data = hybrid_engine.analyze(points)
            msg_calc = WSMessage(type="calculus_update", payload=calc_data)

            for conn in list(active_connections):
                try:
                    await conn.send_text(msg.model_dump_json())
                    await conn.send_text(msg_calc.model_dump_json())
                except Exception:
                    active_connections.discard(conn)

            # Anomaly persistent logging & broadcasting
            if calc_data.get("is_warning"):
                status = calc_data.get("status")
                if status != last_logged_status:
                    last_logged_status = status
                    await save_and_broadcast_alert(
                        status=status,
                        details=calc_data.get("details", ""),
                        flux=latest.flux,
                        slope=calc_data.get("slope", 0.0)
                    )
            else:
                last_logged_status = "STABLE"

        # Fetch and broadcast telemetry + active regions
        telemetry_data, active_regions = await asyncio.gather(
            fetch_telemetry(),
            fetch_solar_regions(),
        )

        msg_telemetry = WSMessage(type="telemetry_update", payload=telemetry_data)
        msg_regions = WSMessage(
            type="regions_update", payload={"regions": active_regions}
        )

        for conn in list(active_connections):
            try:
                await conn.send_text(msg_telemetry.model_dump_json())
                await conn.send_text(msg_regions.model_dump_json())
            except Exception:
                pass

        # Wait 60 seconds, or wake instantly on simulation trigger
        try:
            await asyncio.wait_for(update_event.wait(), timeout=60.0)
            update_event.clear()
        except asyncio.TimeoutError:
            pass


# ─── Simulation Trigger ───────────────────────────────────────────────────────

@router.post("/simulate")
async def trigger_simulation(req: SimulationRequest):
    """Inject synthetic solar event data into the live WebSocket feed."""
    global is_simulating, simulation_queue

    points = generate_flare(req.type, req.duration, req.event_type)
    simulation_queue.extend(points)
    is_simulating = True
    update_event.set()  # Wake up heartbeat immediately

    return {"status": "started", "points": len(points)}
