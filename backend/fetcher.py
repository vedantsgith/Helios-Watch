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

async def fetch_telemetry():
    """
    Fetches real-time Solar Wind, Proton Flux, and Kp Index.
    Returns a dict with the latest values.
    """
    async with httpx.AsyncClient() as client:
        telemetry = {"wind_speed": 450.0, "temp": 100000.0, "density": 5.0, "kp_index": 3.0, "proton_flux": 10.0}
        
        # 1. Solar Wind (Plasma)
        try:
            r = await client.get("https://services.swpc.noaa.gov/products/solar-wind/plasma-5-minute.json", timeout=2.0)
            if r.status_code == 200:
                data = r.json()
                # Format: [time, density, speed, temp] - Last entry is newest
                latest = data[-1] 
                telemetry["density"] = float(latest[1])
                telemetry["wind_speed"] = float(latest[2])
                telemetry["temp"] = float(latest[3])
        except Exception as e:
            print(f"[WARN] Wind Fetch: {e}")

        # 2. Kp Index
        try:
            r = await client.get("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", timeout=2.0)
            if r.status_code == 200:
                data = r.json()
                # Format: [time, kp, a_running, station_count]
                telemetry["kp_index"] = float(data[-1][1])
        except Exception as e:
            print(f"[WARN] Kp Fetch: {e}")

        # 3. Proton Flux (Integral)
        try:
            r = await client.get("https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json", timeout=2.0)
            if r.status_code == 200:
                data = r.json()
                # We want >10MeV flux
                for entry in reversed(data):
                    if entry['energy'] == '>=10 MeV':
                        telemetry["proton_flux"] = float(entry['flux'])
                        break
        except Exception as e:
             print(f"[WARN] Proton Fetch: {e}")

        return telemetry

# Fetch NOAA Active Regions (Sunspots)
async def fetch_solar_regions():
    """
    Fetches active sunspot regions from NOAA.
    Returns: List of dicts {region_number, latitude, longitude, class_type}
    """
    url = "https://services.swpc.noaa.gov/json/solar_regions.json"
    regions = []
    
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, timeout=5.0)
            if r.status_code == 200:
                data = r.json()
                for entry in data:
                    # Only take regions with valid location
                    if entry.get('latitude') and entry.get('longitude'):
                        regions.append({
                            "region_number": entry.get('observed_region_number'),
                            "latitude": float(entry.get('latitude')),
                            "longitude": float(entry.get('longitude')),
                            "class_type": entry.get('magnetic_class', 'Alpha')
                        })
        except Exception as e:
            print(f"[WARN] Region Fetch: {e}")
            
    return regions

if __name__ == "__main__":
    # Quick Test
    points = asyncio.run(fetch_noaa_data())
    print(f"Fetched {len(points)} valid points.")
    if points:
        print(f"Latest: {points[-1]}")
        