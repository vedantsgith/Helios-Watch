import httpx
import asyncio
import json

URL = "https://services.swpc.noaa.gov/json/solar_regions.json"

async def check_regions():
    print(f"Fetching from {URL}...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(URL, timeout=10)
            print(f"Status Code: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                print(f"Total Entries: {len(data)}")
                
                valid_regions = [r for r in data if r.get('latitude') and r.get('longitude')]
                print(f"Valid Lat/Lon Entries: {len(valid_regions)}")

                named_regions = [r for r in valid_regions if r.get('observed_region_number')]
                print(f"Named Regions (with ID): {len(named_regions)}")
                
                if named_regions:
                    print(f"Sample First Region ID: {named_regions[0].get('observed_region_number')}")
                    print(f"Sample First Region Class: {named_regions[0].get('magnetic_class')}")
                else:
                    print("NO NAMED REGIONS FOUND.")
            else:
                print("Failed to fetch.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_regions())
