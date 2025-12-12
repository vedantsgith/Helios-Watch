import httpx
import asyncio
import json

URL = "https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json"

async def check():
    async with httpx.AsyncClient() as client:
        try:
            print(f"Fetching {URL}...")
            r = await client.get(URL, timeout=5.0)
            if r.status_code == 200:
                data = r.json()
                print("SUCCESS. Received", len(data), "items.")
                if data:
                    print("SAMPLE ITEM:")
                    print(json.dumps(data[-1], indent=2))
                    
                    # Search for >=10 MeV
                    found = False
                    for entry in reversed(data):
                        if '>=10 MeV' in entry.get('energy', ''):
                            print("FOUND MATCHING ENTRY:")
                            print(json.dumps(entry, indent=2))
                            found = True
                            break
                    if not found:
                        print("WARNING: No entry with '>=10 MeV' found!")
                        
            else:
                print("Failed:", r.status_code)
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    asyncio.run(check())
