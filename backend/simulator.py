import math
from datetime import datetime, timedelta
from schemas import SolarPoint

def generate_flare(class_type: str, duration_seconds: int = 60):
    """
    Generates a list of synthetic SolarPoints representing a flare.
    """
    points = []
    base_flux = 1e-7  # Quiet sun
    
    # Peak flux definitions
    peaks = {
        "C": 5e-6,
        "M": 2e-5,
        "X": 5e-4
    }
    peak_val = peaks.get(class_type, 1e-5)
    
    start_time = datetime.utcnow()
    
    for i in range(duration_seconds):
        # Time for this point
        t = start_time + timedelta(seconds=i)
        
        # Math: Create a sharp rise and slow decay (Gaussian-ish)
        # 0 to 1 progress
        progress = i / duration_seconds
        
        if progress < 0.2:
            # Rise fast (first 20%)
            factor = (progress / 0.2)
        else:
            # Decay slow (remaining 80%)
            factor = 1 - ((progress - 0.2) / 0.8)
            
        current_flux = base_flux + (peak_val * factor)
        
        # Add random noise so it looks real
        noise = (current_flux * 0.05) * math.sin(i)
        final_flux = current_flux + noise
        
        points.append(SolarPoint(
            timestamp=t,
            flux=final_flux,
            class_type=class_type,
            source="simulation"
        ))
        
    return points