#!/usr/bin/env python3
"""
Simple test script to verify the frontend setup
"""

import requests
import json
import time

def test_backend():
    """Test if the backend is running and responding"""
    try:
        # Test if backend is running
        response = requests.get("http://localhost:5000", timeout=5)
        print("✅ Backend is running")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running. Please start it with: cd ai && python rag.py")
        return False
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False

def test_frontend():
    """Test if the frontend is running"""
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running")
            return True
        else:
            print(f"❌ Frontend returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Frontend is not running. Please start it with: npm run dev")
        return False
    except Exception as e:
        print(f"❌ Error testing frontend: {e}")
        return False

def test_api_endpoint():
    """Test the /ask endpoint"""
    try:
        payload = {"question": "What are your skills?"}
        response = requests.post("http://localhost:5000/ask", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                print("✅ API endpoint is working")
                print(f"📝 Sample response: {data.get('answer', '')[:100]}...")
                return True
            else:
                print(f"❌ API returned error: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ API returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing API: {e}")
        return False

def main():
    print("🧪 Testing Portfolio Chat Setup...")
    print("=" * 50)
    
    backend_ok = test_backend()
    frontend_ok = test_frontend()
    
    if backend_ok:
        api_ok = test_api_endpoint()
    else:
        api_ok = False
    
    print("=" * 50)
    print("📊 Test Results:")
    print(f"Backend: {'✅ OK' if backend_ok else '❌ FAILED'}")
    print(f"Frontend: {'✅ OK' if frontend_ok else '❌ FAILED'}")
    print(f"API: {'✅ OK' if api_ok else '❌ FAILED'}")
    
    if backend_ok and frontend_ok and api_ok:
        print("\n🎉 Everything is working! You can now:")
        print("1. Open http://localhost:3000 in your browser")
        print("2. Start chatting with the AI about your portfolio")
    else:
        print("\n🔧 Please fix the issues above before using the chat")

if __name__ == "__main__":
    main() 