"""
Pydantic Schemas — Helios-Watch Backend

Defines all request/response models used across the API.
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# ─── Solar Data ───────────────────────────────────────────────────────────────

class SolarPoint(BaseModel):
    timestamp: datetime
    flux: float          # X-ray flux value (e.g., 1.4e-5 W/m²)
    class_type: str      # "Quiet", "C", "M", "X"
    source: str          # "noaa" or "simulation"


class Alert(BaseModel):
    id: str
    timestamp: datetime
    level: str           # e.g., "X1.5"
    message: str         # e.g., "Strong Radio Blackout Risk"
    is_active: bool


class WSMessage(BaseModel):
    type: str            # "heartbeat", "data_update", "alert", "telemetry_update", etc.
    payload: dict


class Telemetry(BaseModel):
    wind_speed: float    # km/s
    temp: float          # Kelvin
    density: float       # p/cm³
    kp_index: float      # 0–9 planetary K-index
    proton_flux: float   # pfu (particle flux units)


class ActiveRegion(BaseModel):
    region_number: int
    latitude: float
    longitude: float
    class_type: str      # e.g., "Beta-Gamma"


# ─── Simulation ───────────────────────────────────────────────────────────────

class SimulationRequest(BaseModel):
    type: str            # "M", "X" (for Flux) OR "wind", "kp", "proton" (for Metrics)
    duration: int
    event_type: str = "flux"  # "flux", "wind", "kp", "proton"


# ─── Auth ─────────────────────────────────────────────────────────────────────

class UserPreferencesRequest(BaseModel):
    email_alerts_enabled: bool
    alert_min_status: str


class UserPreferencesResponse(BaseModel):
    email_alerts_enabled: bool
    alert_min_status: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    message: str
    user: UserResponse
