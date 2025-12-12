from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# 1. The data point for the Chart
class SolarPoint(BaseModel):
    timestamp: datetime
    flux: float          # The X-ray value (e.g., 1.4e-5)
    class_type: str      # "Quiet", "C", "M", "X"
    source: str          # "noaa" or "simulation"

# 2. The Alert structure for the UI & Globe
class Alert(BaseModel):
    id: str
    timestamp: datetime
    level: str           # e.g., "X1.5"
    message: str         # e.g., "Strong Radio Blackout Risk"
    is_active: bool

class WSMessage(BaseModel):
    type: str            # "heartbeat", "data_update", "alert", "telemetry_update"
    payload: dict

# 4. Space Weather Telemetry (New)
class Telemetry(BaseModel):
    wind_speed: float    # km/s
    temp: float          # Kelvin
    density: float       # p/cm^3
    kp_index: float      # 0-9
    proton_flux: float   # pfu

# 5. Active Regions (Sunspots)
class ActiveRegion(BaseModel):
    region_number: int
    latitude: float
    longitude: float
    class_type: str      # e.g. "Beta-Gamma"

