import httpx
import asyncio
from datetime import datetime
from schemas import SolarPoint

# The Official NOAA 6-hour JSON
NOAA_URL = "https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json"

async def fetch_noaa_data():
    """
    Fetches the last 6 hours of X-ray flux data.
    Returns a list of SolarPoint objects.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(NOAA_URL, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            
            clean_points = []
            
            for entry in data:
                # We only want the 'long' channel (0.1-0.8nm) for standard classification
                if entry.get('energy') == '0.1-0.8nm':
                    flux = entry.get('flux')
                    
                    # Determine Class (Physics Logic)
                    class_type = "Quiet"
                    if flux >= 1e-4: class_type = "X"
                    elif flux >= 1e-5: class_type = "M"
                    elif flux >= 1e-6: class_type = "C"
                    
                    point = SolarPoint(
                        timestamp=datetime.fromisoformat(entry['time_tag'].replace('Z', '+00:00')),
                        flux=flux,
                        class_type=class_type,
                        source="noaa"
                    )
                    clean_points.append(point)
            
            # Return last 6 hours (approx 360 points)
            return clean_points[-360:]
            
        except Exception as e:
            print(f"[ERROR] NOAA Fetch Failed: {e}")
            return []

if __name__ == "__main__":
    # Quick Test
    points = asyncio.run(fetch_noaa_data())
    print(f"Fetched {len(points)} valid points.")
    if points:
        print(f"Latest: {points[-1]}")
        