#!/usr/bin/env python3
"""
Featured News Endpoints Test Suite
Tests only the 3 new featured news endpoints
"""

import requests
import json
import sys

BASE_URL = "https://crime-network-2.preview.emergentagent.com/api"

# Test results tracking
results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def log_pass(test_name):
    print(f"✅ PASS: {test_name}")
    results["passed"].append(test_name)

def log_fail(test_name, error):
    print(f"❌ FAIL: {test_name}")
    print(f"   Error: {error}")
    results["failed"].append({"test": test_name, "error": str(error)})

def log_warning(test_name, message):
    print(f"⚠️  WARNING: {test_name}")
    print(f"   Message: {message}")
    results["warnings"].append({"test": test_name, "message": message})

print("=" * 80)
print("FEATURED NEWS - BACKEND API TEST SUITE")
print("=" * 80)
print(f"Base URL: {BASE_URL}\n")

# Global variables
reporter_token = None
reporter_id = "0de4408f-0b2a-4eea-927a-55b60e022c08"
test_news_id = None

# ============ TEST 1: Reporter Login ============
print("\n[1] Testing POST /api/auth/login - Reporter Login")
try:
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "reporter@icn.com", "password": "reporter123"},
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if "token" in data and "user" in data:
            reporter_token = data["token"]
            actual_reporter_id = data["user"].get("id")
            print(f"   Reporter ID: {actual_reporter_id}")
            if data["user"].get("role") == "reporter":
                log_pass("Reporter login")
            else:
                log_fail("Reporter login", f"Role mismatch: {data['user'].get('role')}")
        else:
            log_fail("Reporter login", f"Missing token or user: {data}")
    else:
        log_fail("Reporter login", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Reporter login", str(e))

# ============ TEST 2: GET /api/featured (Public) ============
print("\n[2] Testing GET /api/featured - Get Featured News (Public)")
try:
    resp = requests.get(f"{BASE_URL}/featured", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        print(f"   Response: {json.dumps(data, indent=2)}")
        
        # Check required fields
        required_fields = ["featured", "slotsTotal", "slotsUsed", "slotsAvailable", "full", "fee", "durationHours"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            log_fail("GET /api/featured - structure", f"Missing fields: {missing_fields}")
        else:
            # Validate field values
            if data["slotsTotal"] != 10:
                log_fail("GET /api/featured - slotsTotal", f"Expected 10, got {data['slotsTotal']}")
            elif data["fee"] != 499:
                log_fail("GET /api/featured - fee", f"Expected 499, got {data['fee']}")
            elif data["durationHours"] != 24:
                log_fail("GET /api/featured - durationHours", f"Expected 24, got {data['durationHours']}")
            elif data["slotsUsed"] < 0 or data["slotsUsed"] > 10:
                log_fail("GET /api/featured - slotsUsed", f"Invalid slotsUsed: {data['slotsUsed']}")
            elif data["slotsAvailable"] != (10 - data["slotsUsed"]):
                log_fail("GET /api/featured - slotsAvailable", f"Math error: {data['slotsAvailable']} != {10 - data['slotsUsed']}")
            elif data["full"] != (data["slotsUsed"] >= 10):
                log_fail("GET /api/featured - full flag", f"full={data['full']} but slotsUsed={data['slotsUsed']}")
            else:
                log_pass("GET /api/featured - structure and values")
                print(f"   ✓ Slots: {data['slotsUsed']}/10 used, {data['slotsAvailable']} available")
                print(f"   ✓ Fee: ₹{data['fee']} for {data['durationHours']}h")
                print(f"   ✓ Full: {data['full']}")
            
            # Check featured array
            if not isinstance(data["featured"], list):
                log_fail("GET /api/featured - featured array", "featured is not an array")
            else:
                print(f"   ✓ Featured news count: {len(data['featured'])}")
                
                # Verify each featured news has required fields
                for idx, news in enumerate(data["featured"]):
                    if not news.get("isFeatured"):
                        log_fail(f"GET /api/featured - news[{idx}].isFeatured", "isFeatured is not true")
                        break
                    if "featuredUntil" not in news:
                        log_fail(f"GET /api/featured - news[{idx}].featuredUntil", "featuredUntil missing")
                        break
                    # Check if featuredUntil is in the future
                    from datetime import datetime
                    try:
                        featured_until = datetime.fromisoformat(news["featuredUntil"].replace("Z", "+00:00"))
                        if featured_until <= datetime.now(featured_until.tzinfo):
                            log_fail(f"GET /api/featured - news[{idx}].featuredUntil", f"featuredUntil is in the past: {news['featuredUntil']}")
                            break
                    except Exception as e:
                        log_fail(f"GET /api/featured - news[{idx}].featuredUntil", f"Invalid date format: {e}")
                        break
                else:
                    log_pass("GET /api/featured - featured array validation")
    else:
        log_fail("GET /api/featured", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("GET /api/featured", str(e))

# ============ TEST 3: Get Reporter's Approved News ============
print("\n[3] Testing GET /api/news - Get Reporter's Approved News")
try:
    resp = requests.get(
        f"{BASE_URL}/news?reporterId={reporter_id}&status=approved&limit=10",
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if "news" in data and len(data["news"]) > 0:
            # Find a news that is NOT currently featured
            non_featured_news = [n for n in data["news"] if not n.get("isFeatured")]
            if non_featured_news:
                test_news_id = non_featured_news[0]["id"]
                print(f"   Found non-featured news ID: {test_news_id}")
                print(f"   Headline: {non_featured_news[0].get('headline', 'N/A')[:60]}...")
                log_pass("Get reporter's approved news")
            else:
                log_warning("Get reporter's approved news", "All reporter's news are already featured")
                # Use any news for testing
                test_news_id = data["news"][0]["id"]
                print(f"   Using news ID (may be featured): {test_news_id}")
        else:
            log_fail("Get reporter's approved news", "No approved news found for reporter")
    else:
        log_fail("Get reporter's approved news", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Get reporter's approved news", str(e))

# ============ TEST 4: POST /api/featured/order - Without Token (401) ============
print("\n[4] Testing POST /api/featured/order - Without Bearer Token (Expect 401)")
if test_news_id:
    try:
        resp = requests.post(
            f"{BASE_URL}/featured/order",
            json={"newsId": test_news_id},
            timeout=10
        )
        if resp.status_code == 401:
            log_pass("POST /api/featured/order - 401 without token")
        else:
            log_fail("POST /api/featured/order - 401 without token", f"Expected 401, got {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("POST /api/featured/order - 401 without token", str(e))
else:
    log_warning("POST /api/featured/order - 401 without token", "No test news ID available")

# ============ TEST 5: POST /api/featured/order - Invalid newsId (404) ============
print("\n[5] Testing POST /api/featured/order - Invalid newsId (Expect 404)")
if reporter_token:
    try:
        resp = requests.post(
            f"{BASE_URL}/featured/order",
            headers={"Authorization": f"Bearer {reporter_token}"},
            json={"newsId": "invalid-news-id-12345"},
            timeout=10
        )
        if resp.status_code == 404:
            log_pass("POST /api/featured/order - 404 invalid newsId")
        else:
            log_fail("POST /api/featured/order - 404 invalid newsId", f"Expected 404, got {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("POST /api/featured/order - 404 invalid newsId", str(e))
else:
    log_warning("POST /api/featured/order - 404 invalid newsId", "No reporter token available")

# ============ TEST 6: POST /api/featured/order - Success with Valid newsId ============
print("\n[6] Testing POST /api/featured/order - Success with Valid newsId")
if reporter_token and test_news_id:
    try:
        resp = requests.post(
            f"{BASE_URL}/featured/order",
            headers={"Authorization": f"Bearer {reporter_token}"},
            json={"newsId": test_news_id},
            timeout=10
        )
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {resp.text[:500]}")
        
        if resp.status_code == 200:
            data = resp.json()
            # Check required fields
            required_fields = ["orderId", "amount", "keyId", "slotsAvailable"]
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                log_fail("POST /api/featured/order - success response", f"Missing fields: {missing_fields}")
            else:
                # Validate values
                if data["amount"] != 49900:
                    log_fail("POST /api/featured/order - amount", f"Expected 49900 paise, got {data['amount']}")
                elif not data["orderId"].startswith("order_"):
                    log_fail("POST /api/featured/order - orderId format", f"Invalid orderId format: {data['orderId']}")
                elif not data["keyId"].startswith("rzp_"):
                    log_fail("POST /api/featured/order - keyId format", f"Invalid keyId format: {data['keyId']}")
                else:
                    log_pass("POST /api/featured/order - success")
                    print(f"   ✓ Order ID: {data['orderId']}")
                    print(f"   ✓ Amount: ₹{data['amount']/100} ({data['amount']} paise)")
                    print(f"   ✓ Key ID: {data['keyId']}")
                    print(f"   ✓ Slots Available: {data['slotsAvailable']}")
        elif resp.status_code == 400:
            # Could be "Already featured" or "Slots full"
            data = resp.json()
            error_msg = data.get("error", "")
            if "Already featured" in error_msg:
                log_warning("POST /api/featured/order - success", f"News already featured: {error_msg}")
            elif "full" in error_msg.lower():
                log_warning("POST /api/featured/order - success", f"Slots full: {error_msg}")
            else:
                log_fail("POST /api/featured/order - success", f"Unexpected 400: {error_msg}")
        else:
            log_fail("POST /api/featured/order - success", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("POST /api/featured/order - success", str(e))
else:
    log_warning("POST /api/featured/order - success", "No reporter token or test news ID available")

# ============ TEST 7: POST /api/featured/activate - Missing Fields (400) ============
print("\n[7] Testing POST /api/featured/activate - Missing Fields (Expect 400)")
if reporter_token and test_news_id:
    try:
        resp = requests.post(
            f"{BASE_URL}/featured/activate",
            headers={"Authorization": f"Bearer {reporter_token}"},
            json={"newsId": test_news_id},  # Missing payment fields
            timeout=10
        )
        if resp.status_code == 400:
            data = resp.json()
            if "Missing payment fields" in data.get("error", ""):
                log_pass("POST /api/featured/activate - 400 missing fields")
            else:
                log_fail("POST /api/featured/activate - 400 missing fields", f"Wrong error message: {data.get('error')}")
        else:
            log_fail("POST /api/featured/activate - 400 missing fields", f"Expected 400, got {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("POST /api/featured/activate - 400 missing fields", str(e))
else:
    log_warning("POST /api/featured/activate - 400 missing fields", "No reporter token or test news ID available")

# ============ TEST 8: POST /api/featured/activate - Invalid Signature (400) ============
print("\n[8] Testing POST /api/featured/activate - Invalid Signature (Expect 400)")
if reporter_token and test_news_id:
    try:
        resp = requests.post(
            f"{BASE_URL}/featured/activate",
            headers={"Authorization": f"Bearer {reporter_token}"},
            json={
                "razorpay_order_id": "order_fake123",
                "razorpay_payment_id": "pay_fake456",
                "razorpay_signature": "fake_signature_12345",
                "newsId": test_news_id
            },
            timeout=10
        )
        if resp.status_code == 400:
            data = resp.json()
            if "Invalid signature" in data.get("error", ""):
                log_pass("POST /api/featured/activate - 400 invalid signature")
            else:
                log_fail("POST /api/featured/activate - 400 invalid signature", f"Wrong error message: {data.get('error')}")
        else:
            log_fail("POST /api/featured/activate - 400 invalid signature", f"Expected 400, got {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("POST /api/featured/activate - 400 invalid signature", str(e))
else:
    log_warning("POST /api/featured/activate - 400 invalid signature", "No reporter token or test news ID available")

# ============ TEST 9: Regression - GET /api/news Still Works ============
print("\n[9] Testing GET /api/news - Regression Check (Lazy Expiry)")
try:
    resp = requests.get(f"{BASE_URL}/news?page=1&limit=5", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        if "news" in data and "hasMore" in data:
            log_pass("GET /api/news - regression check")
            print(f"   ✓ Returned {len(data['news'])} news items")
        else:
            log_fail("GET /api/news - regression check", f"Missing fields: {data.keys()}")
    else:
        log_fail("GET /api/news - regression check", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("GET /api/news - regression check", str(e))

# ============ FINAL SUMMARY ============
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"✅ PASSED: {len(results['passed'])}")
print(f"❌ FAILED: {len(results['failed'])}")
print(f"⚠️  WARNINGS: {len(results['warnings'])}")
print("=" * 80)

if results["failed"]:
    print("\n❌ FAILED TESTS:")
    for fail in results["failed"]:
        print(f"  - {fail['test']}: {fail['error']}")

if results["warnings"]:
    print("\n⚠️  WARNINGS:")
    for warn in results["warnings"]:
        print(f"  - {warn['test']}: {warn['message']}")

print("\n" + "=" * 80)
if len(results["failed"]) == 0:
    print("🎉 ALL FEATURED NEWS TESTS PASSED!")
    sys.exit(0)
else:
    print(f"⚠️  {len(results['failed'])} TEST(S) FAILED")
    sys.exit(1)
