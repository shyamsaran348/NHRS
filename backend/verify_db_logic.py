import sys
import bcrypt
from database import SessionLocal
import models


def run_verification():
    print("=== Executing Direct Database Integrity & RBAC Assertion ===")
    
    db = SessionLocal()
    try:
        # Assertion 1: Verify DCE Super Admin
        dce = db.query(models.User).filter(models.User.role == "DCE").first()
        assert dce is not None, "DCE Admin should exist"
        print(f"[PASSED] DCE Super Admin found: {dce.name} ({dce.email})")

        # Assertion 2: Verify Circle and Division Seeding
        chennai_circle = db.query(models.Circle).filter(models.Circle.name == "Chennai").first()
        assert chennai_circle is not None, "Chennai circle should be seeded"
        print(f"[PASSED] Circle found: {chennai_circle.name} (ID: {chennai_circle.id})")

        ccr1_division = db.query(models.Division).filter(models.Division.name == "CCR 1").first()
        assert ccr1_division is not None, "CCR 1 division should be seeded"
        assert ccr1_division.circle_id == chennai_circle.id, "CCR 1 must belong to Chennai"
        print(f"[PASSED] Division found: {ccr1_division.name} in Circle {chennai_circle.name}")

        # Assertion 3: Verify User and Password Hash Integrity
        de_user = db.query(models.User).filter(models.User.email == "de_ccr_1@nhrs.gov.in").first()
        assert de_user is not None, "CCR 1 DE should exist"
        assert de_user.circle_id == chennai_circle.id, "DE must be in Chennai circle"
        assert de_user.division_id == ccr1_division.id, "DE must be in CCR 1 division"
        
        # Verify password validation logic
        is_pwd_valid = bcrypt.checkpw("Password123!".encode("utf-8"), de_user.password_hash.encode("utf-8"))
        assert is_pwd_valid is True, "Seeded password must match BCrypt verification"
        print(f"[PASSED] DE Account Integrity Verified: {de_user.name} | BCrypt Match: Yes")

        # Assertion 4: Verify team manager link
        dse_manager = db.query(models.User).filter(models.User.id == de_user.assigned_dse_id).first()
        assert dse_manager is not None, "DE should be assigned to their Circle DSE manager"
        assert dse_manager.role == "DSE", "Assigned manager must be a DSE"
        assert dse_manager.circle_id == chennai_circle.id, "DSE manager must be in Chennai Circle"
        print(f"[PASSED] Team Assignment Integrity Verified: {de_user.name} is in team of {dse_manager.name}")

        # Assertion 5: Verify Project Entry Seeding
        sample_entry = db.query(models.ProjectEntry).filter(models.ProjectEntry.created_by_id == de_user.id).first()
        assert sample_entry is not None, "Sample project entry should be seeded under CCR 1 DE"
        assert sample_entry.circle_id == chennai_circle.id, "Project must map to Chennai circle"
        assert sample_entry.status == "PENDING", "Sample entry should initially be PENDING"
        print(f"[PASSED] Seeded Project Entry Verified: '#{sample_entry.id} - {sample_entry.name_of_work[:50]}...' Status: {sample_entry.status}")

        # Assertion 6: Verify DSE visibility rules
        # Fetch active team DE IDs for the Chennai DSE
        team_de_ids = [u.id for u in db.query(models.User).filter(
            models.User.assigned_dse_id == dse_manager.id,
            models.User.is_deleted == False
        ).all()]
        assert de_user.id in team_de_ids, "DE should be in Chennai DSE's team list"
        
        # Query project entries matching DSE's team DEs
        dse_visible_entries = db.query(models.ProjectEntry).filter(
            models.ProjectEntry.created_by_id.in_(team_de_ids),
            models.ProjectEntry.is_deleted == False
        ).all()
        assert len(dse_visible_entries) > 0, "DSE should see their team's entries"
        print(f"[PASSED] DSE Data Isolation Verified: {dse_manager.name} can view {len(dse_visible_entries)} team submissions.")

        # Assertion 7: Verify DCE visibility rules (only APPROVED entries visible)
        dce_visible_entries = db.query(models.ProjectEntry).filter(
            models.ProjectEntry.status == "APPROVED",
            models.ProjectEntry.is_deleted == False
        ).all()
        assert len(dce_visible_entries) == 0, "DCE should see 0 approved entries since sample is PENDING"
        print(f"[PASSED] DCE Approval Isolation Verified: DCE sees 0 approved works (sample entry is properly isolated while PENDING).")

        print("=== All Database & Logic Verification Checks Passed Successfully! ===")
    except Exception as e:
        print(f"[FAILED] Verification failed: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_verification()
