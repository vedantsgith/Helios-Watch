from datetime import datetime

class HybridEngine:
    def __init__(self):
        # 1. Calculus Thresholds (Rate of Change)
        self.DERIVATIVE_WARNING = 1e-7  # W/m²/min (Early Warning)
        
        # 2. If-Else Thresholds (Absolute Flux)
        self.M_CLASS_LIMIT = 1e-5
        self.X_CLASS_LIMIT = 1e-4

    def calculate_slope(self, points):
        """
        Calculates the rate of change (slope) from the last few points.
        Returns: float (W/m²/min)
        """
        if not points or len(points) < 2:
            return 0.0

        p2 = points[-1]
        p1 = points[-2]
        d_flux = p2.flux - p1.flux
        
        t2 = p2.timestamp
        t1 = p1.timestamp
        d_time_seconds = (t2 - t1).total_seconds()
        
        if d_time_seconds == 0:
            return 0.0
            
        d_time_minutes = d_time_seconds / 60.0
        return d_flux / d_time_minutes

    def analyze(self, points):
        """
        Hybrid Analysis: Combines Calculus (Early Warning) + Threshold (Confirmations)
        Supports:
        - List[SolarPoint] for X-Ray Flux
        - Dict for Telemetry (Wind, Kp, Proton)
        """
        status = "STABLE"
        details = "Calm"
        is_warning = False
        value_display = "N/A" # For email reports

        # --- A. TELEMETRY ANALYSIS (Dict Input) ---
        if isinstance(points, dict):
            # Check for various threat types in the single telemetry packet
            # 1. Solar Wind
            if points.get("wind_speed", 0) > 800:
                status = "FAST_SOLAR_WIND"
                details = f"Wind Speed Critical: {points['wind_speed']:.1f} km/s"
                is_warning = True
                value_display = f"{points['wind_speed']} km/s"
            
            # 2. Geomagnetic Storm (Kp)
            elif points.get("kp_index", 0) >= 7:
                status = "GEOMAGNETIC_STORM"
                details = f"Severe Storm Detected (Kp-{points['kp_index']})"
                is_warning = True
                value_display = f"Kp {points['kp_index']}"

            # 3. Radiation Storm (Proton)
            elif points.get("proton_flux", 0) >= 100:
                status = "RADIATION_STORM"
                details = f"High Proton Flux: {points['proton_flux']:.1f} pfu"
                is_warning = True
                value_display = f"{points['proton_flux']} pfu"
            
            return {
                "slope": 0,
                "status": status,
                "details": details,
                "is_warning": is_warning,
                "threshold": 0,
                "value_display": value_display,
                "engine_type": "TELEMETRY_CHECK"
            }

        # --- B. X-RAY FLUX ANALYSIS (List Input) ---
        if not points:
             return {"slope": 0, "status": "STABLE", "details": "No Data", "is_warning": False}

        current_flux = points[-1].flux
        slope = self.calculate_slope(points)
        value_display = f"{current_flux:.2e} W/m²"

        # 1. CHECK THRESHOLDS
        if current_flux >= self.X_CLASS_LIMIT:
            status = "X_CLASS_FLARE"
            details = "MAJOR EVENT IN PROGRESS"
            is_warning = True
        elif current_flux >= self.M_CLASS_LIMIT:
            status = "M_CLASS_FLARE"
            details = "Moderate Flare Ongoing"
            is_warning = True
        
        # 2. CHECK CALCULUS
        elif slope > self.DERIVATIVE_WARNING:
            status = "RAPID_INTENSIFICATION"
            details = "Early Warning: Flux Rising Fast"
            is_warning = True
        
        # 3. CHECK DECAY
        elif slope < -1e-8 and current_flux > 1e-6:
             details = "Flux Decay (Cooling)"

        return {
            "slope": slope,
            "status": status,
            "details": details,
            "is_warning": is_warning,
            "threshold": self.DERIVATIVE_WARNING,
            "value_display": value_display,
            "engine_type": "HYBRID (Calculus + Threshold)"
        }
