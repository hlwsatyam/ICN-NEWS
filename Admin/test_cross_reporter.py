#!/usr/bin/env python3
"""
Test cross-reporter task report submission (should fail with 403)
"""

import requests
import sys

BASE_URL = "https://crime-network-2.preview.emergentagent.com/api"

print("Testing Cross-Reporter Task Report Submission")
print("=" * 80)

# Login admin
resp = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@icn.com", "password": "admin123"}, timeout=10)
admin_token = resp.json()["token"]
print("✅ Admin logged in")

# Login reporter 1
resp = requests.post(f"{BASE_URL}/auth/login", json={"email": "reporter@icn.com", "password": "reporter123"}, timeout=10)
reporter1_token = resp.json()["token"]
reporter1_id = resp.json()["user"]["id"]
print(f"✅ Reporter 1 logged in (ID: {reporter1_id})")

# Get all tasks to find one NOT assigned to reporter1
resp = requests.get(f"{BASE_URL}/admin/tasks", headers={"Authorization": f"Bearer {admin_token}"}, timeout=10)
tasks = resp.json()["tasks"]

# Find a task not assigned to reporter1, or create one
other_task_id = None
for task in tasks:
    if task.get("assignedTo") != reporter1_id:
        other_task_id = task["id"]
        print(f"✅ Found task assigned to someone else: {other_task_id}")
        break

if not other_task_id:
    # Create a dummy reporter and task
    print("Creating new reporter and task for test...")
    resp = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": "tempreporter@test.com",
            "password": "test123",
            "name": "Temp Reporter",
            "mobile": "9999999999",
            "state": "Delhi",
            "district": "New Delhi",
            "role": "reporter"
        },
        timeout=10
    )
    if resp.status_code == 200:
        reporter2_id = resp.json()["user"]["id"]
        print(f"✅ Created temp reporter (ID: {reporter2_id})")
        
        # Create task for reporter2
        resp = requests.post(
            f"{BASE_URL}/admin/tasks",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "title": "Test Task for Reporter 2",
                "description": "Test",
                "assignedTo": reporter2_id,
                "priority": "low",
                "location": "Test"
            },
            timeout=10
        )
        if resp.status_code == 200:
            other_task_id = resp.json()["task"]["id"]
            print(f"✅ Created task for reporter 2: {other_task_id}")

# Now try to submit report as reporter1 on other_task
if other_task_id:
    print(f"\nAttempting to submit report on task {other_task_id} as reporter1...")
    resp = requests.post(
        f"{BASE_URL}/tasks/{other_task_id}/report",
        headers={"Authorization": f"Bearer {reporter1_token}"},
        json={
            "summary": "Trying to submit on someone else's task",
            "status": "submitted"
        },
        timeout=10
    )
    
    if resp.status_code == 403:
        print("✅ PASS: Correctly returned 403 (Not your task)")
        sys.exit(0)
    else:
        print(f"❌ FAIL: Expected 403, got {resp.status_code}: {resp.text}")
        sys.exit(1)
else:
    print("❌ Could not find or create a task for testing")
    sys.exit(1)
