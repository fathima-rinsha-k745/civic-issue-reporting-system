import urllib.request
import json
import urllib.error

url = 'http://127.0.0.1:8000/api/register/'
data = {
    "email": "live_test@example.com",
    "password": "testpassword123",
    "full_name": "Live Test User"
}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.getcode()}")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
