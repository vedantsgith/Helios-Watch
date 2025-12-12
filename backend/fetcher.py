import httpx
import asyncio
from datetime import datetime
from schemas import SolarPoint

# The Official NOAA 3-day JSON (Robust source for full 24h+)
NOAA_URL = "https://services.swpc.noaa.gov/json/goes/primary/xrays-3-day.json"

async def fetch_noaa_data():
    """
    Fetches X-ray flux data.
    Returns the last 24 hours of SolarPoint objects.
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
            
            # Return last 24 hours (approx 1440 minutes)
            return clean_points[-1440:]
            
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

# Fetch Historical Telemetry (Wind, Kp, Proton) for Graph Initialization
async def fetch_telemetry_history():
    """
    Fetches the last 24 hours of Solar Wind, Kp Index, and Proton Flux.
    Returns: { "wind": [...], "kp": [...], "proton": [...] }
    """
    history = {"wind": [], "kp": [], "proton": []}
    
    async with httpx.AsyncClient() as client:
        # 1. Solar Wind History (24 Hours)
        # URL: https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json
        try:
            r = await client.get("https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json", timeout=4.0)
            if r.status_code == 200:
                data = r.json() # List of lists: [time, density, speed, temp]
                # Skip header
                start_idx = 1 if isinstance(data[0][0], str) and "time" in data[0][0].lower() else 0
                
                for entry in data[start_idx:]:
                    # entry: [time_tag, density, speed, temp]
                    try:
                        if entry[2]: 
                            history["wind"].append({
                                "timestamp": entry[0],
                                "value": float(entry[2])
                            })
                    except: continue
        except Exception as e:
            print(f"[WARN] Wind History Fetch: {e}")

        # 2. Kp Index History
        try:
            r = await client.get("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", timeout=3.0)
            if r.status_code == 200:
                data = r.json() 
                # Gemini said "Array of Objects" but existing code and standard NOAA JSON often use "Array of Arrays" for products.
                # We will handle both just in case.
                
                is_dict = isinstance(data[0], dict) if data else False
                start_idx = 1 if not is_dict and isinstance(data[0][0], str) and "time" in data[0][0].lower() else 0

                for entry in data[start_idx:]:
                    try:
                        if is_dict:
                            # Object format
                            ts = entry.get("time_tag")
                            val = float(entry.get("Kp", 0))
                        else:
                            # List format: [time, kp, ...]
                            ts = entry[0]
                            val = float(entry[1])
                            
                        history["kp"].append({
                            "timestamp": ts,
                            "value": val
                        })
                    except: continue
        except Exception as e:
            print(f"[WARN] Kp History Fetch: {e}")

        # 3. Proton Flux History (24 Hours)
        # URL: https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json
        try:
            r = await client.get("https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json", timeout=4.0)
            if r.status_code == 200:
                data = r.json() # Array of Objects
                
                for entry in data:
                    # Filter for >=10 MeV
                    if entry.get('energy') == '>=10 MeV':
                        try:
                            history["proton"].append({
                                "timestamp": entry['time_tag'],
                                "value": float(entry['flux'])
                            })
                        except: continue
        except Exception as e:
            print(f"[WARN] Proton History Fetch: {e}")
            
    return history

if __name__ == "__main__":
    # Quick Test
    points = asyncio.run(fetch_noaa_data())
    print(f"Fetched {len(points)} valid points.")
    
    hist = asyncio.run(fetch_telemetry_history())
    print(f"Wind History: {len(hist['wind'])} points")
    print(f"Kp History: {len(hist['kp'])} points")
    print(f"Proton History: {len(hist['proton'])} points")
        