import urllib.request
import json
import urllib.error

url = "http://127.0.0.1:8000/api/brownie/request-otp"
payload = {"email": "adityarajmandloi123@gmail.com"}
headers = {"Content-Type": "application/json"}

try:
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    
    print(f"Sending POST to {url}...")
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print(f"Response: {response.read().decode('utf-8')}")
        
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(f"Response: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Request Failed: {e}")
