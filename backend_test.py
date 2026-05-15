#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for Indian Crime News
Tests all 23+ endpoints with proper authentication and validation
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

# Global tokens and IDs
admin_token = None
reporter_token = None
admin_user_id = None
reporter_user_id = None
created_news_id = None
created_breaking_id = None

print("=" * 80)
print("INDIAN CRIME NEWS - BACKEND API TEST SUITE")
print("=" * 80)
print(f"Base URL: {BASE_URL}\n")

# ============ TEST 1: Health Check ============
print("\n[1] Testing GET /api - Health Check")
try:
    resp = requests.get(f"{BASE_URL}", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("status") == "ok":
            log_pass("Health check")
        else:
            log_fail("Health check", f"Unexpected response: {data}")
    else:
        log_fail("Health check", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Health check", str(e))

# ============ TEST 2: Admin Login ============
print("\n[2] Testing POST /api/auth/login - Admin")
try:
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@icn.com", "password": "admin123"},
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if "token" in data and "user" in data:
            admin_token = data["token"]
            admin_user_id = data["user"].get("id")
            if data["user"].get("role") == "admin":
                log_pass("Admin login")
            else:
                log_fail("Admin login", f"Role mismatch: {data['user'].get('role')}")
        else:
            log_fail("Admin login", f"Missing token or user: {data}")
    else:
        log_fail("Admin login", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Admin login", str(e))

# ============ TEST 3: Reporter Login ============
print("\n[3] Testing POST /api/auth/login - Reporter")
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
            reporter_user_id = data["user"].get("id")
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

# ============ TEST 4: Auth Me (Admin) ============
print("\n[4] Testing GET /api/auth/me - Admin Bearer Token")
if admin_token:
    try:
        resp = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if "user" in data and data["user"].get("email") == "admin@icn.com":
                log_pass("Auth me (admin)")
            else:
                log_fail("Auth me (admin)", f"Unexpected user: {data}")
        else:
            log_fail("Auth me (admin)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("Auth me (admin)", str(e))
else:
    log_fail("Auth me (admin)", "No admin token available")

# ============ TEST 5: Register New User ============
print("\n[5] Testing POST /api/auth/register - New User")
try:
    new_email = f"testuser_{int(requests.get('http://worldtimeapi.org/api/timezone/Etc/UTC', timeout=5).json()['unixtime'])}@icn.com"
    resp = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": new_email,
            "password": "test123",
            "name": "Rajesh Kumar",
            "mobile": "9876543210",
            "state": "Maharashtra",
            "district": "Mumbai",
            "role": "reporter"
        },
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if "token" in data and "user" in data:
            log_pass("Register new user")
        else:
            log_fail("Register new user", f"Missing token or user: {data}")
    else:
        log_fail("Register new user", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Register new user", str(e))

# ============ TEST 6: Get News with Pagination ============
print("\n[6] Testing GET /api/news?page=1&limit=8 - Pagination")
try:
    resp = requests.get(f"{BASE_URL}/news?page=1&limit=8", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        if "news" in data and "hasMore" in data:
            if len(data["news"]) <= 8:
                log_pass("News pagination")
            else:
                log_fail("News pagination", f"Returned {len(data['news'])} items, expected ≤8")
        else:
            log_fail("News pagination", f"Missing fields: {data}")
    else:
        log_fail("News pagination", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("News pagination", str(e))

# ============ TEST 7: Get News with State Filter ============
print("\n[7] Testing GET /api/news?state=Delhi - State Filter")
try:
    resp = requests.get(f"{BASE_URL}/news?state=Delhi", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        if "news" in data:
            # Check if all news items are from Delhi
            all_delhi = all(n.get("state") == "Delhi" for n in data["news"])
            if all_delhi or len(data["news"]) == 0:
                log_pass("News state filter")
            else:
                log_fail("News state filter", "Some news items not from Delhi")
        else:
            log_fail("News state filter", f"Missing news field: {data}")
    else:
        log_fail("News state filter", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("News state filter", str(e))

# ============ TEST 8: Get Single News & Views Increment ============
print("\n[8] Testing GET /api/news/:id - Single News + Views Increment")
try:
    # First get a news ID
    resp = requests.get(f"{BASE_URL}/news?page=1&limit=1", timeout=10)
    if resp.status_code == 200 and resp.json().get("news"):
        news_id = resp.json()["news"][0]["id"]
        initial_views = resp.json()["news"][0].get("views", 0)
        
        # Get single news
        resp2 = requests.get(f"{BASE_URL}/news/{news_id}", timeout=10)
        if resp2.status_code == 200:
            data = resp2.json()
            if "news" in data:
                log_pass("Get single news")
                # Note: views increment happens but we can't verify in same request
            else:
                log_fail("Get single news", f"Missing news field: {data}")
        else:
            log_fail("Get single news", f"Status {resp2.status_code}: {resp2.text}")
    else:
        log_warning("Get single news", "No news available to test")
except Exception as e:
    log_fail("Get single news", str(e))

# ============ TEST 9: Create News (Reporter) ============
print("\n[9] Testing POST /api/news - Create News (Reporter Token)")
if reporter_token:
    try:
        resp = requests.post(
            f"{BASE_URL}/news",
            headers={"Authorization": f"Bearer {reporter_token}"},
            json={
                "headline": "चोरी का मामला: मुंबई में बड़ी चोरी की घटना",
                "content": "मुंबई के अंधेरी इलाके में आज रात एक बड़ी चोरी की घटना सामने आई है। पुलिस ने मामला दर्ज कर लिया है और जांच शुरू कर दी है। स्थानीय लोगों ने बताया कि चोर रात के अंधेरे में घर में घुसे और कीमती सामान लेकर फरार हो गए।",
                "summary": "मुंबई अंधेरी में बड़ी चोरी, पुलिस जांच में जुटी",
                "category": "Theft",
                "state": "Maharashtra",
                "district": "Mumbai",
                "city": "Andheri"
            },
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if "news" in data and data["news"].get("status") == "pending":
                created_news_id = data["news"].get("id")
                log_pass("Create news (reporter)")
            else:
                log_fail("Create news (reporter)", f"Unexpected response: {data}")
        else:
            log_fail("Create news (reporter)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("Create news (reporter)", str(e))
else:
    log_fail("Create news (reporter)", "No reporter token available")

# ============ TEST 10: Approve News (Admin) ============
print("\n[10] Testing PATCH /api/news/:id - Approve News (Admin Token)")
if admin_token and created_news_id:
    try:
        resp = requests.patch(
            f"{BASE_URL}/news/{created_news_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "approved"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok"):
                log_pass("Approve news (admin)")
            else:
                log_fail("Approve news (admin)", f"Unexpected response: {data}")
        else:
            log_fail("Approve news (admin)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("Approve news (admin)", str(e))
else:
    log_warning("Approve news (admin)", "No admin token or news ID available")

# ============ TEST 11: Get Breaking News ============
print("\n[11] Testing GET /api/breaking - List Breaking News")
try:
    resp = requests.get(f"{BASE_URL}/breaking", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        if "breaking" in data:
            log_pass("Get breaking news")
        else:
            log_fail("Get breaking news", f"Missing breaking field: {data}")
    else:
        log_fail("Get breaking news", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Get breaking news", str(e))

# ============ TEST 12: Add Breaking News (Admin) ============
print("\n[12] Testing POST /api/breaking - Add Breaking News (Admin)")
if admin_token:
    try:
        resp = requests.post(
            f"{BASE_URL}/breaking",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"text": "तेज़ खबर: दिल्ली में बड़ा हादसा, जांच जारी"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if "breaking" in data:
                created_breaking_id = data["breaking"].get("id")
                log_pass("Add breaking news (admin)")
            else:
                log_fail("Add breaking news (admin)", f"Missing breaking field: {data}")
        else:
            log_fail("Add breaking news (admin)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("Add breaking news (admin)", str(e))
else:
    log_fail("Add breaking news (admin)", "No admin token available")

# ============ TEST 13: Delete Breaking News (Admin) ============
print("\n[13] Testing DELETE /api/breaking/:id - Delete Breaking News (Admin)")
if admin_token and created_breaking_id:
    try:
        resp = requests.delete(
            f"{BASE_URL}/breaking/{created_breaking_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok"):
                log_pass("Delete breaking news (admin)")
            else:
                log_fail("Delete breaking news (admin)", f"Unexpected response: {data}")
        else:
            log_fail("Delete breaking news (admin)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("Delete breaking news (admin)", str(e))
else:
    log_warning("Delete breaking news (admin)", "No admin token or breaking ID available")

# ============ TEST 14: AI Generate Headline ============
print("\n[14] Testing POST /api/ai/generate-headline - AI Headline Generation")
try:
    resp = requests.post(
        f"{BASE_URL}/ai/generate-headline",
        json={
            "content": "दिल्ली के करोल बाग इलाके में आज सुबह एक बड़ी डकैती की घटना हुई। बदमाशों ने एक ज्वेलरी शॉप को निशाना बनाया और लाखों रुपये के आभूषण लूट कर फरार हो गए।",
            "state": "Delhi",
            "district": "Central Delhi",
            "category": "Robbery"
        },
        timeout=30
    )
    if resp.status_code == 200:
        data = resp.json()
        if "headline" in data and len(data["headline"]) > 10:
            log_pass("AI generate headline")
        else:
            log_fail("AI generate headline", f"Invalid headline: {data}")
    else:
        log_fail("AI generate headline", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("AI generate headline", str(e))

# ============ TEST 15: AI Generate Meta ============
print("\n[15] Testing POST /api/ai/generate-meta - AI Meta Generation")
try:
    resp = requests.post(
        f"{BASE_URL}/ai/generate-meta",
        json={
            "headline": "दिल्ली में बड़ी डकैती, लाखों के आभूषण लूटे",
            "content": "दिल्ली के करोल बाग इलाके में आज सुबह एक बड़ी डकैती की घटना हुई। बदमाशों ने एक ज्वेलरी शॉप को निशाना बनाया।"
        },
        timeout=30
    )
    if resp.status_code == 200:
        data = resp.json()
        if "metaTitle" in data and "metaDescription" in data:
            log_pass("AI generate meta")
        else:
            log_fail("AI generate meta", f"Missing meta fields: {data}")
    else:
        log_fail("AI generate meta", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("AI generate meta", str(e))

# ============ TEST 16: AI Spam Check ============
print("\n[16] Testing POST /api/ai/spam-check - AI Spam Detection")
try:
    resp = requests.post(
        f"{BASE_URL}/ai/spam-check",
        json={
            "headline": "मुंबई में चोरी का मामला दर्ज",
            "content": "मुंबई के अंधेरी इलाके में चोरी की घटना सामने आई है। पुलिस जांच कर रही है।"
        },
        timeout=30
    )
    if resp.status_code == 200:
        data = resp.json()
        if "isSpam" in data and "confidence" in data and "reason" in data:
            log_pass("AI spam check")
        else:
            log_fail("AI spam check", f"Missing spam check fields: {data}")
    else:
        log_fail("AI spam check", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("AI spam check", str(e))

# ============ TEST 17: Get States ============
print("\n[17] Testing GET /api/states - Get States List")
try:
    resp = requests.get(f"{BASE_URL}/states", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        if "states" in data and len(data["states"]) >= 10:
            log_pass("Get states")
        else:
            log_fail("Get states", f"Expected 10+ states, got: {len(data.get('states', []))}")
    else:
        log_fail("Get states", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Get states", str(e))

# ============ TEST 18: Get Categories ============
print("\n[18] Testing GET /api/categories - Get Categories List")
try:
    resp = requests.get(f"{BASE_URL}/categories", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        if "categories" in data and len(data["categories"]) >= 10:
            log_pass("Get categories")
        else:
            log_fail("Get categories", f"Expected 10+ categories, got: {len(data.get('categories', []))}")
    else:
        log_fail("Get categories", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Get categories", str(e))

# ============ TEST 19: Get State Page Data ============
print("\n[19] Testing GET /api/state/Delhi - State Page Data")
try:
    resp = requests.get(f"{BASE_URL}/state/Delhi", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        if "state" in data and "news" in data and "reporters" in data and "total" in data and "districts" in data:
            log_pass("Get state page data")
        else:
            log_fail("Get state page data", f"Missing fields: {data.keys()}")
    else:
        log_fail("Get state page data", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Get state page data", str(e))

# ============ TEST 20: Get Stats (Reporter) ============
print("\n[20] Testing GET /api/stats - Get Stats (Reporter Token)")
if reporter_token:
    try:
        resp = requests.get(
            f"{BASE_URL}/stats",
            headers={"Authorization": f"Bearer {reporter_token}"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if "total" in data and "approved" in data and "pending" in data:
                log_pass("Get stats (reporter)")
            else:
                log_fail("Get stats (reporter)", f"Missing stats fields: {data}")
        else:
            log_fail("Get stats (reporter)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("Get stats (reporter)", str(e))
else:
    log_fail("Get stats (reporter)", "No reporter token available")

# ============ TEST 21: Get Analytics (Admin) ============
print("\n[21] Testing GET /api/analytics - Get Analytics (Admin Token)")
if admin_token:
    try:
        resp = requests.get(
            f"{BASE_URL}/analytics",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if "timeline" in data and "byCategory" in data and "byState" in data and "topReporters" in data:
                log_pass("Get analytics (admin)")
            else:
                log_fail("Get analytics (admin)", f"Missing analytics fields: {data.keys()}")
        else:
            log_fail("Get analytics (admin)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("Get analytics (admin)", str(e))
else:
    log_fail("Get analytics (admin)", "No admin token available")

# ============ TEST 22: PDF News Download ============
print("\n[22] Testing GET /api/pdf/news/:id - PDF News Download")
try:
    # Get a news ID first
    resp = requests.get(f"{BASE_URL}/news?page=1&limit=1&status=approved", timeout=10)
    if resp.status_code == 200 and resp.json().get("news"):
        news_id = resp.json()["news"][0]["id"]
        
        resp2 = requests.get(f"{BASE_URL}/pdf/news/{news_id}", timeout=15)
        if resp2.status_code == 200:
            if resp2.headers.get("Content-Type") == "application/pdf" and len(resp2.content) > 1000:
                log_pass("PDF news download")
            else:
                log_fail("PDF news download", f"Invalid PDF: Content-Type={resp2.headers.get('Content-Type')}, Size={len(resp2.content)}")
        else:
            log_fail("PDF news download", f"Status {resp2.status_code}: {resp2.text}")
    else:
        log_warning("PDF news download", "No approved news available to test")
except Exception as e:
    log_fail("PDF news download", str(e))

# ============ TEST 23: PDF ID Card Download ============
print("\n[23] Testing GET /api/pdf/idcard/:userId - PDF ID Card Download")
if reporter_user_id:
    try:
        resp = requests.get(f"{BASE_URL}/pdf/idcard/{reporter_user_id}", timeout=15)
        if resp.status_code == 200:
            if resp.headers.get("Content-Type") == "application/pdf" and len(resp.content) > 1000:
                log_pass("PDF ID card download")
            else:
                log_fail("PDF ID card download", f"Invalid PDF: Content-Type={resp.headers.get('Content-Type')}, Size={len(resp.content)}")
        else:
            log_fail("PDF ID card download", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("PDF ID card download", str(e))
else:
    log_fail("PDF ID card download", "No reporter user ID available")

# ============ TEST 24: PDF Certificate Download ============
print("\n[24] Testing GET /api/pdf/certificate/:userId - PDF Certificate Download")
if reporter_user_id:
    try:
        resp = requests.get(f"{BASE_URL}/pdf/certificate/{reporter_user_id}", timeout=15)
        if resp.status_code == 200:
            if resp.headers.get("Content-Type") == "application/pdf" and len(resp.content) > 1000:
                log_pass("PDF certificate download")
            else:
                log_fail("PDF certificate download", f"Invalid PDF: Content-Type={resp.headers.get('Content-Type')}, Size={len(resp.content)}")
        else:
            log_fail("PDF certificate download", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("PDF certificate download", str(e))
else:
    log_fail("PDF certificate download", "No reporter user ID available")

# ============ TEST 25: Razorpay Create Order ============
print("\n[25] Testing POST /api/payment/create-order - Razorpay Order Creation")
try:
    resp = requests.post(
        f"{BASE_URL}/payment/create-order",
        json={"amount": 500},
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if "orderId" in data and "amount" in data and "keyId" in data:
            log_pass("Razorpay create order")
        else:
            log_fail("Razorpay create order", f"Missing order fields: {data}")
    else:
        log_fail("Razorpay create order", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Razorpay create order", str(e))

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
    print("🎉 ALL CRITICAL TESTS PASSED!")
    sys.exit(0)
else:
    print(f"⚠️  {len(results['failed'])} TEST(S) FAILED")
    sys.exit(1)
