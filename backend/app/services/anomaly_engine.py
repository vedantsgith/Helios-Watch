"""
Anomaly Engine — Helios-Watch Backend

Hybrid detection combining calculus-based derivative analysis with absolute thresholds.
Moved from: backend/derivative_engine.py
"""

from app.models.schemas import SolarPoint


class HybridEngine:
    """
    Hybrid anomaly detection engine.

    Layer 1 (Threshold): Detects M-class and X-class flares by absolute flux.
    Layer 2 (Calculus): Early warning via dFlux/dt — detects rapid intensification
                        before thresholds are breached.
    """

    def __init__(self):
        # Calculus threshold: rate of change that triggers early warning (W/m²/min)
        self.DERIVATIVE_WARNING = 1e-7

        # Absolute flux thresholds (NOAA standard)
        self.M_CLASS_LIMIT = 1e-5
        self.X_CLASS_LIMIT = 1e-4

    def calculate_slope(self, points: list[SolarPoint]) -> float:
        """
        Calculates the instantaneous rate of change from the last two data points.

        Returns:
            float: dFlux/dt in W/m²/min (positive = rising, negative = decaying)
        """
        if not points or len(points) < 2:
            return 0.0

        p2 = points[-1]
        p1 = points[-2]
        d_flux = p2.flux - p1.flux

        d_time_seconds = (p2.timestamp - p1.timestamp).total_seconds()
        if d_time_seconds == 0:
            return 0.0

        d_time_minutes = d_time_seconds / 60.0
        return d_flux / d_time_minutes

    def analyze(self, points: list[SolarPoint]) -> dict:
        """
        Hybrid Analysis: Combines Calculus (Early Warning) + Threshold (Confirmation)

        Returns:
            dict with keys: slope, status, details, is_warning, threshold, engine_type
        """
        if not points:
            return {
                "slope": 0,
                "status": "STABLE",
                "details": "No Data",
                "is_warning": False,
                "threshold": self.DERIVATIVE_WARNING,
                "engine_type": "HYBRID (Calculus + Threshold)",
            }

        current_flux = points[-1].flux
        slope = self.calculate_slope(points)

        status = "STABLE"
        details = "Calm"
        is_warning = False

        # Layer 1: Absolute Threshold Check
        if current_flux >= self.X_CLASS_LIMIT:
            status = "X_CLASS_FLARE"
            details = "MAJOR EVENT IN PROGRESS"
            is_warning = True
        elif current_flux >= self.M_CLASS_LIMIT:
            status = "M_CLASS_FLARE"
            details = "Moderate Flare Ongoing"
            is_warning = True

        # Layer 2: Derivative Check (only if not already in major flare)
        elif slope > self.DERIVATIVE_WARNING:
            status = "RAPID_INTENSIFICATION"
            details = "Early Warning: Flux Rising Fast"
            is_warning = True

        # Decay detection
        elif slope < -1e-8 and current_flux > 1e-6:
            details = "Flux Decay (Cooling)"

        return {
            "slope": slope,
            "status": status,
            "details": details,
            "is_warning": is_warning,
            "threshold": self.DERIVATIVE_WARNING,
            "engine_type": "HYBRID (Calculus + Threshold)",
        }
