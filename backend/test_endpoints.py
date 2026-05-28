import sys
import unittest
from fastapi.testclient import TestClient

from main import app
from database import SessionLocal
import models


class TestNHRSPermissions(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def get_token(self, email, password="Password123!"):
        response = self.client.post(
            "/api/auth/login",
            json={"email": email, "password": password}
        )
        self.assertEqual(response.status_code, 200, f"Login failed for {email}")
        return response.json()["access_token"]

    def test_complete_rbac_workflow(self):
        print("\n--- Starting Hierarchical Workflow & Security RBAC Test ---")

        # 1. Log in as Divisional Engineer (DE)
        de_email = "de_ccr_1@nhrs.gov.in"
        de_token = self.get_token(de_email)
        headers_de = {"Authorization": f"Bearer {de_token}"}

        # 2. Submit new project entry as DE
        new_project_data = {
            "scheme": "CRIDP",
            "year": "2025-26",
            "name_of_work": "Test Highway Construction under Automated Verification Suite",
            "admin_sanction_value": 300.0,
            "tech_sanction_value": 300.0,
            "go_details": "G.O. (Ms) No. 99, 2026",
            "present_stage": "Surveying"
        }
        
        create_res = self.client.post("/api/entries", json=new_project_data, headers=headers_de)
        self.assertEqual(create_res.status_code, 200)
        entry_id = create_res.json()["id"]
        print(f"DE submitted new project entry successfully. ID: {entry_id}")

        # 3. Assert DE sees their own entry in entries list
        list_res_de = self.client.get("/api/entries", headers=headers_de)
        self.assertEqual(list_res_de.status_code, 200)
        de_work_ids = [entry["id"] for entry in list_res_de.json()]
        self.assertIn(entry_id, de_work_ids)
        print("Verification: DE can view their own submitted entry.")

        # 4. Assert a DIFFERENT DE cannot see or access this entry (Data Isolation Check!)
        other_de_email = "de_edappadi@nhrs.gov.in"
        other_de_token = self.get_token(other_de_email)
        headers_other_de = {"Authorization": f"Bearer {other_de_token}"}
        
        get_res_other_de = self.client.get(f"/api/entries/{entry_id}", headers=headers_other_de)
        self.assertEqual(get_res_other_de.status_code, 403)
        print("Security Check: Other DE is forbidden from viewing this entry (403 Forbidden).")

        # 5. Log in as Circle DSE (Chennai Circle)
        dse_email = "dse_chennai@nhrs.gov.in"
        dse_token = self.get_token(dse_email)
        headers_dse = {"Authorization": f"Bearer {dse_token}"}

        # 6. DSE reviews and approves the submission
        review_data = {
            "status": "APPROVED"
        }
        review_res = self.client.put(f"/api/entries/{entry_id}/review", json=review_data, headers=headers_dse)
        self.assertEqual(review_res.status_code, 200)
        self.assertEqual(review_res.json()["status"], "APPROVED")
        print(f"DSE successfully approved project entry #{entry_id}.")

        # 7. Log in as Deputy Chief Engineer (DCE)
        dce_email = "dce@nhrs.gov.in"
        dce_token = self.get_token(dce_email)
        headers_dce = {"Authorization": f"Bearer {dce_token}"}

        # 8. Assert DCE sees this approved project globally
        list_res_dce = self.client.get("/api/entries", headers=headers_dce)
        self.assertEqual(list_res_dce.status_code, 200)
        dce_work_ids = [entry["id"] for entry in list_res_dce.json()]
        self.assertIn(entry_id, dce_work_ids)
        print("Verification: DCE can view the approved project entry centrally.")

        # 8b. Assert DCE can fetch circles and divisions (Metadata check)
        circles_res = self.client.get("/api/circles", headers=headers_dce)
        self.assertEqual(circles_res.status_code, 200)
        self.assertGreater(len(circles_res.json()), 0)
        print(f"Verification: DCE successfully fetched {len(circles_res.json())} circles.")

        first_circle_id = circles_res.json()[0]["id"]
        divisions_res = self.client.get(f"/api/divisions?circle_id={first_circle_id}", headers=headers_dce)
        self.assertEqual(divisions_res.status_code, 200)
        print(f"Verification: DCE successfully fetched divisions for circle ID {first_circle_id}.")

        # 9. Clean up (Soft Delete)
        delete_res = self.client.delete(f"/api/entries/{entry_id}", headers=headers_dce)
        self.assertEqual(delete_res.status_code, 204)
        print(f"DCE securely soft-deleted the verification project entry #{entry_id}.")

        print("--- All Hierarchical RBAC Verification Tests Passed Successfully! ---")

    def test_user_registration_and_validation(self):
        print("\n--- Starting User Registration & Validation Test ---")
        
        # 1. Attempt to register a new user via API
        reg_payload = {
            "name": "Er. P. Srinivasan",
            "email": "de_srinivasan_test@nhrs.gov.in",
            "password": "Password123!",
            "role": "DE",
            "circle_id": 1,
            "division_id": 1
        }
        
        reg_res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(reg_res.status_code, 200, f"Registration failed: {reg_res.text}")
        reg_data = reg_res.json()
        self.assertEqual(reg_data["name"], "Er. P. Srinivasan")
        self.assertEqual(reg_data["email"], "de_srinivasan_test@nhrs.gov.in")
        self.assertEqual(reg_data["role"], "DE")
        print("Verification: Registration endpoint returned valid User schema.")

        # 2. Check that the newly registered user has been assigned to their DSE manager automatically (Chennai Circle DSE)
        # Verify from database
        user_in_db = self.db.query(models.User).filter(models.User.email == "de_srinivasan_test@nhrs.gov.in").first()
        self.assertIsNotNone(user_in_db)
        self.assertIsNotNone(user_in_db.assigned_dse_id, "New DE in Circle 1 was not auto-assigned to Chennai DSE manager")
        self.assertFalse(user_in_db.is_active, "New registered user must be inactive by default")
        print("Verification: New DE was successfully auto-assigned and is inactive by default.")

        # 3. Test that the newly registered user CANNOT login immediately and is blocked
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "de_srinivasan_test@nhrs.gov.in", "password": "Password123!"}
        )
        self.assertEqual(login_res.status_code, 400)
        self.assertEqual(
            login_res.json()["detail"],
            "Your account is pending administrative approval from the Deputy Chief Engineer (DCE)."
        )
        print("Verification: Login was successfully blocked with custom approval warning message.")

        # 4. Authenticate as Deputy Chief Engineer (DCE)
        dce_email = "dce@nhrs.gov.in"
        dce_token = self.get_token(dce_email)
        headers_dce = {"Authorization": f"Bearer {dce_token}"}

        # 5. Fetch the pending queue as DCE and assert new user is listed
        pending_res = self.client.get("/api/auth/users/pending", headers=headers_dce)
        self.assertEqual(pending_res.status_code, 200)
        pending_emails = [u["email"] for u in pending_res.json()]
        self.assertIn("de_srinivasan_test@nhrs.gov.in", pending_emails)
        print("Verification: DCE can fetch pending queue and see registered user.")

        # 6. Approve the user as DCE
        approve_res = self.client.put(f"/api/auth/users/{user_in_db.id}/approve", headers=headers_dce)
        self.assertEqual(approve_res.status_code, 200)
        self.assertEqual(approve_res.json()["status"], "approved")
        print("Verification: DCE successfully approved pending user.")

        # 7. Test that the approved user can now login successfully
        login_ok_res = self.client.post(
            "/api/auth/login",
            json={"email": "de_srinivasan_test@nhrs.gov.in", "password": "Password123!"}
        )
        self.assertEqual(login_ok_res.status_code, 200)
        self.assertIn("access_token", login_ok_res.json())
        print("Verification: Approved user successfully logged in and retrieved access token.")

        # 8. Cleanup (Hard delete test user and audit logs associated)
        self.db.query(models.AuditLog).filter(models.AuditLog.user_id == user_in_db.id).delete()
        self.db.delete(user_in_db)
        self.db.commit()
        print("Verification: Registration test user and audit logs successfully cleaned up.")
        print("--- All Registration & Administrative Approval Verification Tests Passed! ---")

    def test_profile_update(self):
        print("\n--- Starting User Profile Update Test ---")
        email = "de_ccr_1@nhrs.gov.in"
        original_pass = "Password123!"
        new_pass = "NewSecurePassword123!"
        
        # 1. Login with original credentials
        token = self.get_token(email, original_pass)
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get original name
        me_res = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        original_name = me_res.json()["name"]
        user_id = me_res.json()["id"]
        
        # 3. Update profile name and password
        update_payload = {
            "name": "Er. Srinivasan CCR 1 (Updated)",
            "password": new_pass
        }
        update_res = self.client.put("/api/auth/profile", json=update_payload, headers=headers)
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()["name"], "Er. Srinivasan CCR 1 (Updated)")
        print("Verification: Profile update endpoint accepted changes and returned updated name.")
        
        # 4. Old password should fail to login now
        bad_login_res = self.client.post(
            "/api/auth/login",
            json={"email": email, "password": original_pass}
        )
        self.assertEqual(bad_login_res.status_code, 401)
        print("Verification: Old password was successfully invalidated.")
        
        # 5. New password should succeed to login
        new_token = self.get_token(email, new_pass)
        self.assertIsNotNone(new_token)
        print("Verification: New password successfully authenticated.")
        
        # 6. Revert changes to restore database state for other runs
        revert_headers = {"Authorization": f"Bearer {new_token}"}
        revert_payload = {
            "name": original_name,
            "password": original_pass
        }
        revert_res = self.client.put("/api/auth/profile", json=revert_payload, headers=revert_headers)
        self.assertEqual(revert_res.status_code, 200)
        self.assertEqual(revert_res.json()["name"], original_name)
        print("Verification: Restored original credentials and name successfully.")
        
        # 7. Check that audit logs were written
        audit = self.db.query(models.AuditLog).filter(
            models.AuditLog.user_id == user_id,
            models.AuditLog.action == "UPDATE_PROFILE"
        ).first()
        self.assertIsNotNone(audit)
        print("Verification: UPDATE_PROFILE audit log created successfully.")
        
        # Cleanup reversion audits to keep DB clean
        self.db.query(models.AuditLog).filter(
            models.AuditLog.user_id == user_id,
            models.AuditLog.action == "UPDATE_PROFILE"
        ).delete()
        self.db.commit()
        print("--- All Profile Update Integration Tests Passed! ---")


if __name__ == "__main__":
    unittest.main()
