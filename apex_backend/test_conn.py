import socket
import requests

def test_connectivity():
    host = "generativelanguage.googleapis.com"
    print(f"Testing DNS resolution for {host}...")
    try:
        ip = socket.gethostbyname(host)
        print(f"Success! {host} resolved to {ip}")
    except Exception as e:
        print(f"DNS Resolution FAILED: {e}")

    print("\nTesting HTTP reachability...")
    try:
        r = requests.get(f"https://{host}/", timeout=5)
        print(f"HTTP Status: {r.status_code}")
    except Exception as e:
        print(f"HTTP Request FAILED: {e}")

if __name__ == "__main__":
    test_connectivity()
