#!/usr/bin/env python3
"""
Backend API Test Suite for NEW Features:
- Updates (Company announcements)
- FAQs
- Operations/Tasks with Reports
- Site Settings (with logo field)
- Help (smoke test)
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
reporter_id = "0de4408f-0b2a-4eea-927a-55b60e022c08"
created_update_id = None
created_faq_id = None
created_task_id = None

print("=" * 80)
print("INDIAN CRIME NEWS - NEW FEATURES BACKEND TEST SUITE")
print("=" * 80)
print(f"Base URL: {BASE_URL}\n")

# ============ SETUP: Login ============
print("\n[SETUP] Logging in Admin and Reporter")
try:
    # Admin login
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@icn.com", "password": "admin123"},
        timeout=10
    )
    if resp.status_code == 200:
        admin_token = resp.json()["token"]
        print(f"✅ Admin logged in")
    else:
        print(f"❌ Admin login failed: {resp.status_code}")
        sys.exit(1)
    
    # Reporter login
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "reporter@icn.com", "password": "reporter123"},
        timeout=10
    )
    if resp.status_code == 200:
        reporter_token = resp.json()["token"]
        reporter_id = resp.json()["user"]["id"]
        print(f"✅ Reporter logged in (ID: {reporter_id})")
    else:
        print(f"❌ Reporter login failed: {resp.status_code}")
        sys.exit(1)
except Exception as e:
    print(f"❌ Setup failed: {e}")
    sys.exit(1)

# ============ UPDATES (Company Announcements) ============
print("\n" + "=" * 80)
print("TESTING UPDATES (Company Announcements)")
print("=" * 80)

# TEST 1: POST /admin/updates (admin auth)
print("\n[1] Testing POST /admin/updates - Create Update (Admin)")
try:
    resp = requests.post(
        f"{BASE_URL}/admin/updates",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Important Company Update",
            "body": "This is a test announcement for all reporters. Please read carefully.",
            "type": "info",
            "pinned": True
        },
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if data.get("ok") and "update" in data and "id" in data["update"]:
            created_update_id = data["update"]["id"]
            log_pass("POST /admin/updates (admin)")
        else:
            log_fail("POST /admin/updates (admin)", f"Unexpected response: {data}")
    else:
        log_fail("POST /admin/updates (admin)", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("POST /admin/updates (admin)", str(e))

# TEST 2: GET /updates (with auth - reporter)
print("\n[2] Testing GET /updates - Get Updates (Reporter Auth)")
try:
    resp = requests.get(
        f"{BASE_URL}/updates",
        headers={"Authorization": f"Bearer {reporter_token}"},
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if "updates" in data and isinstance(data["updates"], list):
            log_pass("GET /updates (reporter auth)")
        else:
            log_fail("GET /updates (reporter auth)", f"Unexpected response: {data}")
    else:
        log_fail("GET /updates (reporter auth)", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("GET /updates (reporter auth)", str(e))

# TEST 3: GET /updates (with auth - admin)
print("\n[3] Testing GET /updates - Get Updates (Admin Auth)")
try:
    resp = requests.get(
        f"{BASE_URL}/updates",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if "updates" in data and isinstance(data["updates"], list):
            log_pass("GET /updates (admin auth)")
        else:
            log_fail("GET /updates (admin auth)", f"Unexpected response: {data}")
    else:
        log_fail("GET /updates (admin auth)", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("GET /updates (admin auth)", str(e))

# TEST 4: GET /updates WITHOUT auth (should fail)
print("\n[4] Testing GET /updates - Without Auth (Should 401)")
try:
    resp = requests.get(f"{BASE_URL}/updates", timeout=10)
    if resp.status_code == 401:
        log_pass("GET /updates (no auth) - correctly returns 401")
    else:
        log_fail("GET /updates (no auth)", f"Expected 401, got {resp.status_code}")
except Exception as e:
    log_fail("GET /updates (no auth)", str(e))

# TEST 5: POST /admin/updates (non-admin should fail)
print("\n[5] Testing POST /admin/updates - Non-Admin (Should 403)")
try:
    resp = requests.post(
        f"{BASE_URL}/admin/updates",
        headers={"Authorization": f"Bearer {reporter_token}"},
        json={"title": "Test", "body": "Test"},
        timeout=10
    )
    if resp.status_code == 403:
        log_pass("POST /admin/updates (reporter) - correctly returns 403")
    else:
        log_fail("POST /admin/updates (reporter)", f"Expected 403, got {resp.status_code}")
except Exception as e:
    log_fail("POST /admin/updates (reporter)", str(e))

# TEST 6: DELETE /admin/updates/:id (admin)
print("\n[6] Testing DELETE /admin/updates/:id - Delete Update (Admin)")
if created_update_id:
    try:
        resp = requests.delete(
            f"{BASE_URL}/admin/updates/{created_update_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok"):
                log_pass("DELETE /admin/updates/:id (admin)")
            else:
                log_fail("DELETE /admin/updates/:id (admin)", f"Unexpected response: {data}")
        else:
            log_fail("DELETE /admin/updates/:id (admin)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("DELETE /admin/updates/:id (admin)", str(e))
else:
    log_warning("DELETE /admin/updates/:id", "No update ID available")

# TEST 7: DELETE /admin/updates/:id (non-admin should fail)
print("\n[7] Testing DELETE /admin/updates/:id - Non-Admin (Should 403)")
try:
    resp = requests.delete(
        f"{BASE_URL}/admin/updates/fake-id",
        headers={"Authorization": f"Bearer {reporter_token}"},
        timeout=10
    )
    if resp.status_code == 403:
        log_pass("DELETE /admin/updates/:id (reporter) - correctly returns 403")
    else:
        log_fail("DELETE /admin/updates/:id (reporter)", f"Expected 403, got {resp.status_code}")
except Exception as e:
    log_fail("DELETE /admin/updates/:id (reporter)", str(e))

# ============ FAQs ============
print("\n" + "=" * 80)
print("TESTING FAQs")
print("=" * 80)

# TEST 8: GET /faqs (PUBLIC - no auth)
print("\n[8] Testing GET /faqs - Public Access (No Auth)")
try:
    resp = requests.get(f"{BASE_URL}/faqs", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        if "faqs" in data and isinstance(data["faqs"], list):
            log_pass("GET /faqs (public)")
        else:
            log_fail("GET /faqs (public)", f"Unexpected response: {data}")
    else:
        log_fail("GET /faqs (public)", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("GET /faqs (public)", str(e))

# TEST 9: POST /admin/faqs (admin)
print("\n[9] Testing POST /admin/faqs - Create FAQ (Admin)")
try:
    resp = requests.post(
        f"{BASE_URL}/admin/faqs",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "question": "How do I submit a news article?",
            "answer": "You can submit news articles through the dashboard by clicking the 'Publish News' button.",
            "order": 1
        },
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if data.get("ok") and "faq" in data and "id" in data["faq"]:
            created_faq_id = data["faq"]["id"]
            log_pass("POST /admin/faqs (admin)")
        else:
            log_fail("POST /admin/faqs (admin)", f"Unexpected response: {data}")
    else:
        log_fail("POST /admin/faqs (admin)", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("POST /admin/faqs (admin)", str(e))

# TEST 10: PUT /admin/faqs/:id (admin)
print("\n[10] Testing PUT /admin/faqs/:id - Update FAQ (Admin)")
if created_faq_id:
    try:
        resp = requests.put(
            f"{BASE_URL}/admin/faqs/{created_faq_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "question": "How do I submit a news article? (Updated)",
                "answer": "Updated answer: You can submit news articles through the dashboard."
            },
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok"):
                log_pass("PUT /admin/faqs/:id (admin)")
            else:
                log_fail("PUT /admin/faqs/:id (admin)", f"Unexpected response: {data}")
        else:
            log_fail("PUT /admin/faqs/:id (admin)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("PUT /admin/faqs/:id (admin)", str(e))
else:
    log_warning("PUT /admin/faqs/:id", "No FAQ ID available")

# TEST 11: DELETE /admin/faqs/:id (admin)
print("\n[11] Testing DELETE /admin/faqs/:id - Delete FAQ (Admin)")
if created_faq_id:
    try:
        resp = requests.delete(
            f"{BASE_URL}/admin/faqs/{created_faq_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok"):
                log_pass("DELETE /admin/faqs/:id (admin)")
            else:
                log_fail("DELETE /admin/faqs/:id (admin)", f"Unexpected response: {data}")
        else:
            log_fail("DELETE /admin/faqs/:id (admin)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("DELETE /admin/faqs/:id (admin)", str(e))
else:
    log_warning("DELETE /admin/faqs/:id", "No FAQ ID available")

# ============ OPERATIONS / TASKS ============
print("\n" + "=" * 80)
print("TESTING OPERATIONS / TASKS")
print("=" * 80)

# TEST 12: POST /admin/tasks (admin) - Create Task
print("\n[12] Testing POST /admin/tasks - Create Task (Admin)")
try:
    resp = requests.post(
        f"{BASE_URL}/admin/tasks",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Mumbai Bank Robbery Investigation",
            "description": "Investigate the recent bank robbery case in Mumbai. Gather evidence and interview witnesses.",
            "assignedTo": reporter_id,
            "priority": "high",
            "deadline": "2026-06-15",
            "location": "Mumbai, Maharashtra"
        },
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if data.get("ok") and "task" in data and "id" in data["task"]:
            created_task_id = data["task"]["id"]
            log_pass("POST /admin/tasks (admin)")
        else:
            log_fail("POST /admin/tasks (admin)", f"Unexpected response: {data}")
    else:
        log_fail("POST /admin/tasks (admin)", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("POST /admin/tasks (admin)", str(e))

# TEST 13: POST /admin/tasks without title (should fail)
print("\n[13] Testing POST /admin/tasks - Without Title (Should 400)")
try:
    resp = requests.post(
        f"{BASE_URL}/admin/tasks",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "description": "Test",
            "assignedTo": reporter_id
        },
        timeout=10
    )
    if resp.status_code == 400:
        log_pass("POST /admin/tasks (no title) - correctly returns 400")
    else:
        log_fail("POST /admin/tasks (no title)", f"Expected 400, got {resp.status_code}")
except Exception as e:
    log_fail("POST /admin/tasks (no title)", str(e))

# TEST 14: POST /admin/tasks without assignedTo (should fail)
print("\n[14] Testing POST /admin/tasks - Without AssignedTo (Should 400)")
try:
    resp = requests.post(
        f"{BASE_URL}/admin/tasks",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Test Task",
            "description": "Test"
        },
        timeout=10
    )
    if resp.status_code == 400:
        log_pass("POST /admin/tasks (no assignedTo) - correctly returns 400")
    else:
        log_fail("POST /admin/tasks (no assignedTo)", f"Expected 400, got {resp.status_code}")
except Exception as e:
    log_fail("POST /admin/tasks (no assignedTo)", str(e))

# TEST 15: GET /admin/tasks (admin) - Get All Tasks with Assignee Info
print("\n[15] Testing GET /admin/tasks - Get All Tasks (Admin)")
try:
    resp = requests.get(
        f"{BASE_URL}/admin/tasks",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if "tasks" in data and isinstance(data["tasks"], list):
            # Check if tasks have assignee populated
            if len(data["tasks"]) > 0:
                task = data["tasks"][0]
                if "assignee" in task and "reports" in task:
                    # Check assignee has required fields
                    assignee = task["assignee"]
                    if assignee and all(k in assignee for k in ["id", "name", "photo", "email", "mobile"]):
                        log_pass("GET /admin/tasks (admin) - with assignee populated")
                    else:
                        log_fail("GET /admin/tasks (admin)", f"Assignee missing required fields: {assignee}")
                else:
                    log_fail("GET /admin/tasks (admin)", "Task missing assignee or reports field")
            else:
                log_pass("GET /admin/tasks (admin) - empty list ok")
        else:
            log_fail("GET /admin/tasks (admin)", f"Unexpected response: {data}")
    else:
        log_fail("GET /admin/tasks (admin)", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("GET /admin/tasks (admin)", str(e))

# TEST 16: GET /tasks/my (reporter) - Get My Tasks
print("\n[16] Testing GET /tasks/my - Get My Tasks (Reporter)")
try:
    resp = requests.get(
        f"{BASE_URL}/tasks/my",
        headers={"Authorization": f"Bearer {reporter_token}"},
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if "tasks" in data and isinstance(data["tasks"], list):
            log_pass("GET /tasks/my (reporter)")
        else:
            log_fail("GET /tasks/my (reporter)", f"Unexpected response: {data}")
    else:
        log_fail("GET /tasks/my (reporter)", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("GET /tasks/my (reporter)", str(e))

# TEST 17: POST /tasks/:taskId/report (reporter) - Submit Report
print("\n[17] Testing POST /tasks/:taskId/report - Submit Report (Reporter)")
if created_task_id:
    try:
        resp = requests.post(
            f"{BASE_URL}/tasks/{created_task_id}/report",
            headers={"Authorization": f"Bearer {reporter_token}"},
            json={
                "summary": "Visited the crime scene and interviewed witnesses",
                "findings": "Found evidence of forced entry. Two witnesses confirmed seeing suspicious individuals.",
                "location": "Mumbai Central Bank, Andheri",
                "peopleInvolved": "Bank Manager Mr. Sharma, Security Guard Ramesh",
                "timeSpent": "3 hours",
                "status": "submitted"
            },
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok") and "report" in data:
                log_pass("POST /tasks/:taskId/report (reporter) - status submitted")
            else:
                log_fail("POST /tasks/:taskId/report (reporter)", f"Unexpected response: {data}")
        else:
            log_fail("POST /tasks/:taskId/report (reporter)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("POST /tasks/:taskId/report (reporter)", str(e))
else:
    log_warning("POST /tasks/:taskId/report", "No task ID available")

# TEST 18: Verify task status changed to in-progress
print("\n[18] Testing Task Status Update - Should be 'in-progress'")
if created_task_id:
    try:
        resp = requests.get(
            f"{BASE_URL}/admin/tasks",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            task = next((t for t in data["tasks"] if t["id"] == created_task_id), None)
            if task and task.get("status") == "in-progress":
                log_pass("Task status auto-updated to 'in-progress'")
            else:
                log_fail("Task status update", f"Expected 'in-progress', got: {task.get('status') if task else 'task not found'}")
        else:
            log_fail("Task status update", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("Task status update", str(e))
else:
    log_warning("Task status update", "No task ID available")

# TEST 19: POST /tasks/:taskId/report with status=completed
print("\n[19] Testing POST /tasks/:taskId/report - Status Completed")
if created_task_id:
    try:
        resp = requests.post(
            f"{BASE_URL}/tasks/{created_task_id}/report",
            headers={"Authorization": f"Bearer {reporter_token}"},
            json={
                "summary": "Investigation completed. All evidence collected and documented.",
                "findings": "Case closed. Suspects identified and handed over to police.",
                "location": "Mumbai",
                "peopleInvolved": "Police Inspector Verma",
                "timeSpent": "2 hours",
                "status": "completed"
            },
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok"):
                log_pass("POST /tasks/:taskId/report (status completed)")
            else:
                log_fail("POST /tasks/:taskId/report (completed)", f"Unexpected response: {data}")
        else:
            log_fail("POST /tasks/:taskId/report (completed)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("POST /tasks/:taskId/report (completed)", str(e))
else:
    log_warning("POST /tasks/:taskId/report (completed)", "No task ID available")

# TEST 20: Verify task status changed to completed
print("\n[20] Testing Task Status Update - Should be 'completed'")
if created_task_id:
    try:
        resp = requests.get(
            f"{BASE_URL}/admin/tasks",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            task = next((t for t in data["tasks"] if t["id"] == created_task_id), None)
            if task and task.get("status") == "completed":
                log_pass("Task status auto-updated to 'completed'")
            else:
                log_fail("Task status update to completed", f"Expected 'completed', got: {task.get('status') if task else 'task not found'}")
        else:
            log_fail("Task status update to completed", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("Task status update to completed", str(e))
else:
    log_warning("Task status update to completed", "No task ID available")

# TEST 21: Create another task for cross-reporter test
print("\n[21] Creating Second Task for Cross-Reporter Test")
second_task_id = None
try:
    # Create a new reporter first
    resp = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": f"reporter2_{int(requests.get('http://worldtimeapi.org/api/timezone/Etc/UTC', timeout=5).json()['unixtime'])}@icn.com",
            "password": "test123",
            "name": "Test Reporter 2",
            "mobile": "9876543211",
            "state": "Delhi",
            "district": "New Delhi",
            "role": "reporter"
        },
        timeout=10
    )
    if resp.status_code == 200:
        reporter2_id = resp.json()["user"]["id"]
        
        # Create task assigned to reporter2
        resp = requests.post(
            f"{BASE_URL}/admin/tasks",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "title": "Delhi Investigation Task",
                "description": "Test task for reporter 2",
                "assignedTo": reporter2_id,
                "priority": "medium",
                "deadline": "2026-06-20",
                "location": "Delhi"
            },
            timeout=10
        )
        if resp.status_code == 200:
            second_task_id = resp.json()["task"]["id"]
            print(f"✅ Second task created (ID: {second_task_id})")
        else:
            print(f"⚠️  Could not create second task: {resp.status_code}")
    else:
        print(f"⚠️  Could not create second reporter: {resp.status_code}")
except Exception as e:
    print(f"⚠️  Setup for cross-reporter test failed: {e}")

# TEST 22: Reporter A tries to submit report on Reporter B's task (should fail)
print("\n[22] Testing POST /tasks/:taskId/report - Wrong Reporter (Should 403)")
if second_task_id:
    try:
        resp = requests.post(
            f"{BASE_URL}/tasks/{second_task_id}/report",
            headers={"Authorization": f"Bearer {reporter_token}"},
            json={
                "summary": "Trying to submit on someone else's task",
                "status": "submitted"
            },
            timeout=10
        )
        if resp.status_code == 403:
            log_pass("POST /tasks/:taskId/report (wrong reporter) - correctly returns 403")
        else:
            log_fail("POST /tasks/:taskId/report (wrong reporter)", f"Expected 403, got {resp.status_code}")
    except Exception as e:
        log_fail("POST /tasks/:taskId/report (wrong reporter)", str(e))
else:
    log_warning("POST /tasks/:taskId/report (wrong reporter)", "No second task ID available")

# TEST 23: DELETE /admin/tasks/:id (admin) - Also deletes reports
print("\n[23] Testing DELETE /admin/tasks/:id - Delete Task (Admin)")
if created_task_id:
    try:
        resp = requests.delete(
            f"{BASE_URL}/admin/tasks/{created_task_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok"):
                log_pass("DELETE /admin/tasks/:id (admin)")
            else:
                log_fail("DELETE /admin/tasks/:id (admin)", f"Unexpected response: {data}")
        else:
            log_fail("DELETE /admin/tasks/:id (admin)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("DELETE /admin/tasks/:id (admin)", str(e))
else:
    log_warning("DELETE /admin/tasks/:id", "No task ID available")

# ============ SITE SETTINGS ============
print("\n" + "=" * 80)
print("TESTING SITE SETTINGS")
print("=" * 80)

# TEST 24: GET /site-settings (PUBLIC)
print("\n[24] Testing GET /site-settings - Public Access")
try:
    resp = requests.get(f"{BASE_URL}/site-settings", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        required_fields = ["logo", "siteName", "tagline"]
        if all(field in data for field in required_fields):
            log_pass("GET /site-settings (public) - has logo, siteName, tagline")
        else:
            log_fail("GET /site-settings (public)", f"Missing required fields. Got: {list(data.keys())}")
    else:
        log_fail("GET /site-settings (public)", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("GET /site-settings (public)", str(e))

# TEST 25: PUT /site-settings (admin)
print("\n[25] Testing PUT /site-settings - Update Settings (Admin)")
try:
    resp = requests.put(
        f"{BASE_URL}/site-settings",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "siteName": "Test ICN",
            "tagline": "Test Tagline"
        },
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if data.get("ok"):
            log_pass("PUT /site-settings (admin)")
        else:
            log_fail("PUT /site-settings (admin)", f"Unexpected response: {data}")
    else:
        log_fail("PUT /site-settings (admin)", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("PUT /site-settings (admin)", str(e))

# TEST 26: Verify settings persist
print("\n[26] Testing GET /site-settings - Verify Persistence")
try:
    resp = requests.get(f"{BASE_URL}/site-settings", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("siteName") == "Test ICN" and data.get("tagline") == "Test Tagline":
            log_pass("Site settings persisted correctly")
        else:
            log_fail("Site settings persistence", f"Settings not persisted. Got: siteName={data.get('siteName')}, tagline={data.get('tagline')}")
    else:
        log_fail("Site settings persistence", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Site settings persistence", str(e))

# TEST 27: Restore original settings
print("\n[27] Restoring Original Site Settings")
try:
    resp = requests.put(
        f"{BASE_URL}/site-settings",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "siteName": "Indian Crime News",
            "tagline": "सच्चाई की आवाज़"
        },
        timeout=10
    )
    if resp.status_code == 200:
        print("✅ Original settings restored")
    else:
        print(f"⚠️  Could not restore settings: {resp.status_code}")
except Exception as e:
    print(f"⚠️  Could not restore settings: {e}")

# TEST 28: PUT /site-settings (non-admin should fail)
print("\n[28] Testing PUT /site-settings - Non-Admin (Should 403)")
try:
    resp = requests.put(
        f"{BASE_URL}/site-settings",
        headers={"Authorization": f"Bearer {reporter_token}"},
        json={"siteName": "Hacked"},
        timeout=10
    )
    if resp.status_code == 403:
        log_pass("PUT /site-settings (reporter) - correctly returns 403")
    else:
        log_fail("PUT /site-settings (reporter)", f"Expected 403, got {resp.status_code}")
except Exception as e:
    log_fail("PUT /site-settings (reporter)", str(e))

# ============ HELP (Smoke Test) ============
print("\n" + "=" * 80)
print("TESTING HELP (Smoke Test)")
print("=" * 80)

# TEST 29: POST /help (PUBLIC)
print("\n[29] Testing POST /help - Submit Help Request (Public)")
try:
    resp = requests.post(
        f"{BASE_URL}/help",
        json={
            "name": "Arjun Patel",
            "contact": "9876543210",
            "query": "I need help with submitting news articles. Can you guide me?"
        },
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if data.get("ok") and "message" in data:
            # Check for Hindi message
            if "आपका" in data["message"] or "मिल गया" in data["message"]:
                log_pass("POST /help (public) - returns Hindi message")
            else:
                log_fail("POST /help (public)", f"Message not in Hindi: {data['message']}")
        else:
            log_fail("POST /help (public)", f"Unexpected response: {data}")
    else:
        log_fail("POST /help (public)", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("POST /help (public)", str(e))

# TEST 30: POST /help without required fields (should fail)
print("\n[30] Testing POST /help - Without Required Fields (Should 400)")
try:
    resp = requests.post(
        f"{BASE_URL}/help",
        json={"name": "Test"},
        timeout=10
    )
    if resp.status_code == 400:
        log_pass("POST /help (missing fields) - correctly returns 400")
    else:
        log_fail("POST /help (missing fields)", f"Expected 400, got {resp.status_code}")
except Exception as e:
    log_fail("POST /help (missing fields)", str(e))

# TEST 31: GET /help (admin)
print("\n[31] Testing GET /help - Get Help Requests (Admin)")
try:
    resp = requests.get(
        f"{BASE_URL}/help",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        if "requests" in data and isinstance(data["requests"], list):
            log_pass("GET /help (admin)")
        else:
            log_fail("GET /help (admin)", f"Unexpected response: {data}")
    else:
        log_fail("GET /help (admin)", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("GET /help (admin)", str(e))

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
    print("🎉 ALL NEW FEATURE TESTS PASSED!")
    sys.exit(0)
else:
    print(f"⚠️  {len(results['failed'])} TEST(S) FAILED")
    sys.exit(1)
