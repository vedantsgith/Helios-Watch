"""
NOAA Service — Helios-Watch Backend

Fetches real-time solar data from NOAA's Space Weather Prediction Center APIs.
Moved from: backend/fetcher.py
"""

import httpx
import asyncio
from datetime import datetime
from app.models.schemas import SolarPoint

# Official NOAA 3-day JSON — robust source for full 24h+ of X-ray data
NOAA_URL = "https://services.swpc.noaa.gov/json/goes/primary/xrays-3-day.json"


async def fetch_noaa_data() -> list[SolarPoint]:
    """
    Fetches X-ray flux data from NOAA GOES satellite.
    Returns the last 24 hours of SolarPoint objects (long channel 0.1–0.8nm).
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(NOAA_URL, timeout=5.0)
            response.raise_for_status()
            data = response.json()

            clean_points = []
            for entry in data:
                # Only use the 'long' channel (0.1–0.8nm) for standard classification
                if entry.get("energy") == "0.1-0.8nm":
                    flux = entry.get("flux")

                    # Physics-based class assignment (NOAA scale)
                    class_type = "Quiet"
                    if flux >= 1e-4:
                        class_type = "X"
                    elif flux >= 1e-5:
                        class_type = "M"
                    elif flux >= 1e-6:
                        class_type = "C"

                    point = SolarPoint(
                        timestamp=datetime.fromisoformat(
                            entry["time_tag"].replace("Z", "+00:00")
                        ),
                        flux=flux,
                        class_type=class_type,
                        source="noaa",
                    )
                    clean_points.append(point)

            # Return last 24 hours (approx 1440 minutes)
            return clean_points[-1440:]

        except Exception as e:
            print(f"[ERROR] NOAA Fetch Failed: {e}")
            return []


async def fetch_telemetry() -> dict:
    """
    Fetches real-time Solar Wind plasma, Kp Index, and Proton Flux.
    Returns a dict with the latest values.
    """
    async with httpx.AsyncClient() as client:
        telemetry = {
            "wind_speed": 450.0,
            "temp": 100000.0,
            "density": 5.0,
            "kp_index": 3.0,
            "proton_flux": 10.0,
        }

        # 1. Solar Wind Plasma
        try:
            r = await client.get(
                "https://services.swpc.noaa.gov/products/solar-wind/plasma-5-minute.json",
                timeout=2.0,
            )
            if r.status_code == 200:
                data = r.json()
                latest = data[-1]  # Format: [time, density, speed, temp]
                telemetry["density"] = float(latest[1])
                telemetry["wind_speed"] = float(latest[2])
                telemetry["temp"] = float(latest[3])
        except Exception as e:
            print(f"[WARN] Wind Fetch: {e}")

        # 2. Kp Index
        try:
            r = await client.get(
                "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
                timeout=2.0,
            )
            if r.status_code == 200:
                data = r.json()
                telemetry["kp_index"] = float(data[-1][1])
        except Exception as e:
            print(f"[WARN] Kp Fetch: {e}")

        # 3. Proton Flux (>10 MeV integral)
        try:
            r = await client.get(
                "https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json",
                timeout=2.0,
            )
            if r.status_code == 200:
                data = r.json()
                for entry in reversed(data):
                    if entry["energy"] == ">=10 MeV":
                        telemetry["proton_flux"] = float(entry["flux"])
                        break
        except Exception as e:
            print(f"[WARN] Proton Fetch: {e}")

        return telemetry


async def fetch_solar_regions() -> list[dict]:
    """
    Fetches active sunspot regions from NOAA.
    Returns list of dicts: { region_number, latitude, longitude, class_type }
    """
    url = "https://services.swpc.noaa.gov/json/solar_regions.json"
    regions = []

    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, timeout=5.0)
            if r.status_code == 200:
                data = r.json()
                for entry in data:
                    if entry.get("latitude") and entry.get("longitude"):
                        regions.append(
                            {
                                "region_number": entry.get("observed_region_number"),
                                "latitude": float(entry.get("latitude")),
                                "longitude": float(entry.get("longitude")),
                                "class_type": entry.get("magnetic_class", "Alpha"),
                            }
                        )
        except Exception as e:
            print(f"[WARN] Region Fetch: {e}")

    return regions


async def fetch_telemetry_history() -> dict:
    """
    Fetches 24-hour history of Solar Wind, Kp Index, and Proton Flux.
    Returns: { "wind": [...], "kp": [...], "proton": [...] }
    """
    history: dict = {"wind": [], "kp": [], "proton": []}

    async with httpx.AsyncClient() as client:
        # 1. Solar Wind History (24 Hours)
        try:
            r = await client.get(
                "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json",
                timeout=4.0,
            )
            if r.status_code == 200:
                data = r.json()
                start_idx = (
                    1
                    if isinstance(data[0][0], str) and "time" in data[0][0].lower()
                    else 0
                )
                for entry in data[start_idx:]:
                    try:
                        if entry[2]:
                            history["wind"].append(
                                {"timestamp": entry[0], "value": float(entry[2])}
                            )
                    except Exception:
                        continue
        except Exception as e:
            print(f"[WARN] Wind History Fetch: {e}")

        # 2. Kp Index History
        try:
            r = await client.get(
                "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
                timeout=3.0,
            )
            if r.status_code == 200:
                data = r.json()
                is_dict = isinstance(data[0], dict) if data else False
                start_idx = (
                    1
                    if not is_dict
                    and isinstance(data[0][0], str)
                    and "time" in data[0][0].lower()
                    else 0
                )
                for entry in data[start_idx:]:
                    try:
                        if is_dict:
                            ts = entry.get("time_tag")
                            val = float(entry.get("Kp", 0))
                        else:
                            ts = entry[0]
                            val = float(entry[1])
                        history["kp"].append({"timestamp": ts, "value": val})
                    except Exception:
                        continue
        except Exception as e:
            print(f"[WARN] Kp History Fetch: {e}")

        # 3. Proton Flux History (24 Hours)
        try:
            r = await client.get(
                "https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json",
                timeout=4.0,
            )
            if r.status_code == 200:
                data = r.json()
                for entry in data:
                    if entry.get("energy") == ">=10 MeV":
                        try:
                            history["proton"].append(
                                {
                                    "timestamp": entry["time_tag"],
                                    "value": float(entry["flux"]),
                                }
                            )
                        except Exception:
                            continue
        except Exception as e:
            print(f"[WARN] Proton History Fetch: {e}")

    return history
