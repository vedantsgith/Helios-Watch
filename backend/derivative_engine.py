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
        Returns: dict
        """
        if not points:
             return {"slope": 0, "status": "STABLE", "details": "No Data"}

        current_flux = points[-1].flux
        slope = self.calculate_slope(points)
        
        status = "STABLE"
        details = "Calm"
        is_warning = False

        # --- HYBRID LOGIC ---

        # 1. CHECK THRESHOLDS (The "If-Else" Logic)
        if current_flux >= self.X_CLASS_LIMIT:
            status = "X_CLASS_FLARE"
            details = "MAJOR EVENT IN PROGRESS"
            is_warning = True
        elif current_flux >= self.M_CLASS_LIMIT:
            status = "M_CLASS_FLARE"
            details = "Moderate Flare Ongoing"
            is_warning = True
        
        # 2. CHECK CALCULUS (The "Derivative" Logic)
        # If not yet a major flare, check for rapid rise
        elif slope > self.DERIVATIVE_WARNING:
            status = "RAPID_INTENSIFICATION"
            details = "Early Warning: Flux Rising Fast"
            is_warning = True
        
        # 3. CHECK DECAY (Negative Slope)
        elif slope < -1e-8 and current_flux > 1e-6:
             details = "Flux Decay (Cooling)"

        return {
            "slope": slope,
            "status": status,
            "details": details,
            "is_warning": is_warning,
            "threshold": self.DERIVATIVE_WARNING, # ADDED: Matches Frontend Interface
            "engine_type": "HYBRID (Calculus + Threshold)"
        }
