import math
from datetime import datetime, timedelta
from schemas import SolarPoint

def generate_flare(class_type: str, duration_seconds: int = 60, event_type: str = "flux"):
    """
    Generates synthetic data points for Flux (SolarPoint) OR Telemetry (dict).
    """
    points = []
    start_time = datetime.utcnow()
    
    # 1. FLUX SIMULATION (SolarPoint)
    if event_type == "flux":
        base_flux = 1e-7
        peaks = { "X": 5e-4, "M": 2e-5, "C": 5e-6 }
        peak_val = peaks.get(class_type, 1e-4) # Default to X
        
        for i in range(duration_seconds):
            t = start_time + timedelta(seconds=i)
            progress = i / duration_seconds
            
            # Fast Rise (20%), Slow Decay (80%)
            if progress < 0.2: factor = (progress / 0.2)
            else: factor = 1 - ((progress - 0.2) / 0.8)
            
            current_flux = base_flux + (peak_val * factor)
            noise = (current_flux * 0.05) * math.sin(i)
            
            points.append(SolarPoint(
                timestamp=t, flux=current_flux + noise, class_type=class_type, source="simulation"
            ))
            
    # 2. TELEMETRY SIMULATION (Wind, Kp, Proton) -> Returns list of DICTS
    else:
        # Define Baselines & Peaks
        if event_type == "wind":
            base = 350.0
            peak = 850.0 # >700 Critical
            key = "wind_speed"
        elif event_type == "kp":
            base = 2.0
            peak = 7.0 # >5 Storm
            key = "kp_index"
        elif event_type == "proton":
            base = 0.5
            peak = 500.0 # >100 S2 Storm
            key = "proton_flux"
        else:
            return []

        for i in range(duration_seconds):
            t = start_time + timedelta(seconds=i)
            progress = i / duration_seconds
            
            # Slower Rise (40%), Slow Decay (60%) for massive mass events
            if progress < 0.4: factor = (progress / 0.4)
            else: factor = 1 - ((progress - 0.4) / 0.6)
            
            val = base + ((peak - base) * factor)
            
            # Construct Partial Telemetry Update
            # (Only the simulated key updates, others unknown/omitted implies strict update)
            # Actually, to be safe, we just send a dict with this key and a flag.
            
            points.append({
                "type": "telemetry_sim",
                "timestamp": t.isoformat(),
                key: val
            })

    return points