#!/usr/bin/env python3
"""
Backend API Testing for Henna Artistry Application
Tests all API endpoints as specified in the review request
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://bridal-henna-10.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log_test(test_name, status, details=""):
    color = Colors.GREEN if status == "PASS" else Colors.RED if status == "FAIL" else Colors.YELLOW
    print(f"{color}[{status}]{Colors.END} {test_name}")
    if details:
        print(f"    {details}")

def test_admin_login():
    """Test admin login endpoint"""
    print(f"\n{Colors.BLUE}=== Testing Admin Login ==={Colors.END}")
    
    # Test correct password
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"password": "henna2024"},
            headers=HEADERS,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") == True:
                log_test("Admin login with correct password", "PASS", f"Response: {data}")
            else:
                log_test("Admin login with correct password", "FAIL", f"Expected success=true, got: {data}")
        else:
            log_test("Admin login with correct password", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Admin login with correct password", "FAIL", f"Exception: {str(e)}")
    
    # Test wrong password
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"password": "wrong"},
            headers=HEADERS,
            timeout=10
        )
        
        if response.status_code == 401:
            log_test("Admin login with wrong password", "PASS", f"Correctly returned 401")
        else:
            log_test("Admin login with wrong password", "FAIL", f"Expected 401, got: {response.status_code}")
    except Exception as e:
        log_test("Admin login with wrong password", "FAIL", f"Exception: {str(e)}")

def test_services():
    """Test services endpoints"""
    print(f"\n{Colors.BLUE}=== Testing Services ==={Colors.END}")
    
    # Test GET /api/services
    try:
        response = requests.get(f"{BASE_URL}/services", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("GET /api/services", "PASS", f"Returned {len(data)} services")
                # Check if services have price in kr (Norwegian currency)
                if data:
                    service = data[0]
                    if "price" in service and isinstance(service["price"], (int, float)):
                        log_test("Services have price field", "PASS", f"Sample price: {service['price']} kr")
                    else:
                        log_test("Services have price field", "FAIL", f"Price field missing or invalid in: {service}")
            else:
                log_test("GET /api/services", "FAIL", f"Expected array, got: {type(data)}")
        else:
            log_test("GET /api/services", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("GET /api/services", "FAIL", f"Exception: {str(e)}")
    
    # Test GET /api/services/all
    try:
        response = requests.get(f"{BASE_URL}/services/all", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("GET /api/services/all", "PASS", f"Returned {len(data)} services (including inactive)")
            else:
                log_test("GET /api/services/all", "FAIL", f"Expected array, got: {type(data)}")
        else:
            log_test("GET /api/services/all", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("GET /api/services/all", "FAIL", f"Exception: {str(e)}")

def test_settings():
    """Test settings endpoint"""
    print(f"\n{Colors.BLUE}=== Testing Settings ==={Colors.END}")
    
    try:
        response = requests.get(f"{BASE_URL}/settings", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["business_name", "tagline", "phone", "email"]
            if all(field in data for field in required_fields):
                log_test("GET /api/settings", "PASS", f"Business settings returned with required fields")
            else:
                missing = [field for field in required_fields if field not in data]
                log_test("GET /api/settings", "FAIL", f"Missing required fields: {missing}")
        else:
            log_test("GET /api/settings", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("GET /api/settings", "FAIL", f"Exception: {str(e)}")

def test_bookings():
    """Test bookings endpoints"""
    print(f"\n{Colors.BLUE}=== Testing Bookings ==={Colors.END}")
    
    # Test POST /api/bookings
    sample_booking = {
        "customer_name": "Priya Sharma",
        "customer_email": "priya.sharma@email.com",
        "customer_phone": "46123456789",
        "service_id": None,
        "service_name": "Medium Hand Design",
        "is_custom_quote": False,
        "preferred_date": "2024-02-15",
        "preferred_time": "14:00",
        "location_type": "studio",
        "notes": "Looking forward to beautiful henna for my friend's wedding"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/bookings",
            json=sample_booking,
            headers=HEADERS,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and data["customer_name"] == sample_booking["customer_name"]:
                log_test("POST /api/bookings", "PASS", f"Booking created with ID: {data['id']}")
            else:
                log_test("POST /api/bookings", "FAIL", f"Invalid booking response: {data}")
        else:
            log_test("POST /api/bookings", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("POST /api/bookings", "FAIL", f"Exception: {str(e)}")
    
    # Test GET /api/bookings
    try:
        response = requests.get(f"{BASE_URL}/bookings", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("GET /api/bookings", "PASS", f"Returned {len(data)} bookings")
            else:
                log_test("GET /api/bookings", "FAIL", f"Expected array, got: {type(data)}")
        else:
            log_test("GET /api/bookings", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("GET /api/bookings", "FAIL", f"Exception: {str(e)}")

def test_contacts():
    """Test contacts endpoints"""
    print(f"\n{Colors.BLUE}=== Testing Contacts ==={Colors.END}")
    
    # Test POST /api/contacts
    sample_contact = {
        "name": "Aisha Khan",
        "email": "aisha.khan@email.com",
        "phone": "46987654321",
        "message": "Hi! I'm interested in bridal henna for my wedding in March. Could you please provide more details about your bridal packages and availability?"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/contacts",
            json=sample_contact,
            headers=HEADERS,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and data["name"] == sample_contact["name"]:
                log_test("POST /api/contacts", "PASS", f"Contact created with ID: {data['id']}")
            else:
                log_test("POST /api/contacts", "FAIL", f"Invalid contact response: {data}")
        else:
            log_test("POST /api/contacts", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("POST /api/contacts", "FAIL", f"Exception: {str(e)}")
    
    # Test GET /api/contacts
    try:
        response = requests.get(f"{BASE_URL}/contacts", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("GET /api/contacts", "PASS", f"Returned {len(data)} contacts")
            else:
                log_test("GET /api/contacts", "FAIL", f"Expected array, got: {type(data)}")
        else:
            log_test("GET /api/contacts", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("GET /api/contacts", "FAIL", f"Exception: {str(e)}")

def test_availability():
    """Test availability endpoint"""
    print(f"\n{Colors.BLUE}=== Testing Availability ==={Colors.END}")
    
    try:
        response = requests.get(f"{BASE_URL}/availability", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("GET /api/availability", "PASS", f"Returned {len(data)} availability slots")
                # Check if we have proper schedule structure
                if data:
                    slot = data[0]
                    required_fields = ["day_of_week", "start_time", "end_time", "is_available"]
                    if all(field in slot for field in required_fields):
                        log_test("Availability structure", "PASS", f"Proper schedule format")
                    else:
                        log_test("Availability structure", "FAIL", f"Missing fields in: {slot}")
            else:
                log_test("GET /api/availability", "FAIL", f"Expected array, got: {type(data)}")
        else:
            log_test("GET /api/availability", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("GET /api/availability", "FAIL", f"Exception: {str(e)}")

def test_gallery():
    """Test gallery endpoint"""
    print(f"\n{Colors.BLUE}=== Testing Gallery ==={Colors.END}")
    
    try:
        response = requests.get(f"{BASE_URL}/gallery", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("GET /api/gallery", "PASS", f"Returned {len(data)} gallery items")
            else:
                log_test("GET /api/gallery", "FAIL", f"Expected array, got: {type(data)}")
        else:
            log_test("GET /api/gallery", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("GET /api/gallery", "FAIL", f"Exception: {str(e)}")

def test_seed():
    """Test seed endpoint"""
    print(f"\n{Colors.BLUE}=== Testing Seed ==={Colors.END}")
    
    try:
        response = requests.post(f"{BASE_URL}/seed", headers=HEADERS, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                if "already seeded" in data["message"].lower():
                    log_test("POST /api/seed", "PASS", f"Data already seeded (expected)")
                elif "seeded successfully" in data["message"].lower():
                    log_test("POST /api/seed", "PASS", f"Data seeded successfully")
                else:
                    log_test("POST /api/seed", "WARN", f"Unexpected message: {data['message']}")
            else:
                log_test("POST /api/seed", "FAIL", f"No message in response: {data}")
        else:
            log_test("POST /api/seed", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("POST /api/seed", "FAIL", f"Exception: {str(e)}")

def main():
    """Run all tests"""
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}HENNA ARTISTRY BACKEND API TESTING{Colors.END}")
    print(f"{Colors.BLUE}Testing URL: {BASE_URL}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    
    # Run all tests
    test_admin_login()
    test_services()
    test_settings()
    test_bookings()
    test_contacts()
    test_availability()
    test_gallery()
    test_seed()
    
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}TESTING COMPLETED{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")

if __name__ == "__main__":
    main()