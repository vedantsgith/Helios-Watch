"""
Simulator Service — Helios-Watch Backend

Generates synthetic solar event data for demo/testing purposes.
Moved from: backend/simulator.py
"""

import math
from datetime import datetime, timedelta
from app.models.schemas import SolarPoint


def generate_flare(
    class_type: str,
    duration_seconds: int = 60,
    event_type: str = "flux",
) -> list:
    """
    Generates synthetic data points for Flux (SolarPoint) OR Telemetry (dict).

    Args:
        class_type: "M" or "X" for flux events, ignored for telemetry
        duration_seconds: Number of data points to generate
        event_type: "flux", "wind", "kp", or "proton"

    Returns:
        List of SolarPoint objects (flux) or dicts (telemetry)
    """
    points = []
    start_time = datetime.utcnow()

    # ── FLUX SIMULATION ──────────────────────────────────────────────────────
    if event_type == "flux":
        base_flux = 1e-7
        peaks = {"X": 5e-4, "M": 2e-5, "C": 5e-6}
        peak_val = peaks.get(class_type, 1e-4)

        for i in range(duration_seconds):
            t = start_time + timedelta(seconds=i)
            progress = i / duration_seconds

            # Impulsive rise (20%), gradual decay (80%) — realistic flare profile
            if progress < 0.2:
                factor = progress / 0.2
            else:
                factor = 1 - ((progress - 0.2) / 0.8)

            current_flux = base_flux + (peak_val * factor)
            noise = (current_flux * 0.05) * math.sin(i)

            points.append(
                SolarPoint(
                    timestamp=t,
                    flux=current_flux + noise,
                    class_type=class_type,
                    source="simulation",
                )
            )

    # ── TELEMETRY SIMULATION ─────────────────────────────────────────────────
    else:
        if event_type == "wind":
            base, peak, key = 350.0, 850.0, "wind_speed"
        elif event_type == "kp":
            base, peak, key = 2.0, 7.0, "kp_index"
        elif event_type == "proton":
            base, peak, key = 0.5, 500.0, "proton_flux"
        else:
            return []

        for i in range(duration_seconds):
            progress = i / duration_seconds

            # Slower rise (40%), gradual decay (60%) for mass ejection events
            if progress < 0.4:
                factor = progress / 0.4
            else:
                factor = 1 - ((progress - 0.4) / 0.6)

            val = base + ((peak - base) * factor)

            points.append(
                {
                    "type": "telemetry_sim",
                    "timestamp": (start_time + timedelta(seconds=i)).isoformat(),
                    key: val,
                }
            )

    return points
