import os
import datetime
import pandas as pd
from sqlalchemy.orm import Session

import models
from database import SessionLocal

# Helper to determine the current active financial year and the 3-year retention window
def get_retention_years(retention_count=3):
    today = datetime.date.today()
    current_year = today.getFullYear() if hasattr(today, 'getFullYear') else today.year
    current_month = today.month
    
    # Financial year runs from April 1st to March 31st
    base_year = current_year if current_month >= 4 else current_year - 1
    
    # Generate list of active years to retain (e.g. current year + 2 previous years)
    active_years = []
    for i in range(retention_count):
        start_year = base_year - i
        end_year_string = String_last_two_digits = str(start_year + 1)[-2:]
        active_years.append(f"{start_year}-{end_year_string}")
        
    return active_years

def run_archiver():
    db: Session = SessionLocal()
    try:
        active_years = get_retention_years(3)
        print(f"--- NHRS Historical Database Archiver ---")
        print(f"Active retention window (Last 3 years to KEEP): {', '.join(active_years)}")
        
        # Query entries that are NOT in the active retention window (and not already deleted/archived)
        query = db.query(models.ProjectEntry).filter(
            models.ProjectEntry.is_deleted == False
        )
        
        all_entries = query.all()
        archive_candidates = [e for e in all_entries if e.year not in active_years]
        
        if not archive_candidates:
            print("Status: No historical data older than 3 years found in the database. Archiving not required.")
            return

        print(f"Found {len(archive_candidates)} historical entries candidate for archiving.")

        # Create archives directory if it doesn't exist
        archives_dir = os.path.join(os.path.dirname(__file__), "archives")
        os.makedirs(archives_dir, exist_ok=True)
        
        # Convert SQLAlchemy objects to Pandas DataFrame for clean Excel extraction
        data_list = []
        for e in archive_candidates:
            data_list.append({
                "ID": e.id,
                "Creator ID": e.created_by_id,
                "Circle": e.circle.name if e.circle else "N/A",
                "Division": e.division.name if e.division else "N/A",
                "Scheme": e.scheme,
                "Financial Year": e.year,
                "G.O. Details": e.go_details,
                "Technical Sanction": e.technical_sanction,
                "Admin Sanction (Lakhs)": e.admin_sanction_value,
                "Technical Sanction (Lakhs)": e.tech_sanction_value,
                "Name of Work": e.name_of_work,
                "Contract Value (Lakhs)": e.contract_value,
                "Tender Notice No": e.tender_notice_no,
                "Tender Notice Date": e.tender_notice_date,
                "Bid Submission Date": e.bid_submission_date,
                "Bid Opening Date": e.bid_opening_date,
                "Accepting Authority": e.tender_accepting_authority,
                "Approved Date": e.tender_approved_on,
                "Work Order Date": e.work_order_issued_on,
                "Agreement Date": e.agreement_executed_on,
                "Present Stage": e.present_stage,
                "Remarks": e.remarks,
                "Status": e.status,
                "Submitted At": e.submitted_at
            })
            
        df = pd.DataFrame(data_list)
        
        # Generate dynamic file name with timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"archived_tenders_pre_{active_years[-1].split('-')[0]}_{timestamp}.xlsx"
        filepath = os.path.join(archives_dir, filename)
        
        # Save to Formatted Excel Spreadsheet
        df.to_excel(filepath, index=False)
        print(f"Success: Staged historical data exported to archive: {filepath}")

        # Delete archived records from the live database
        archived_ids = [e.id for e in archive_candidates]
        db.query(models.ProjectEntry).filter(models.ProjectEntry.id.in_(archived_ids)).delete(synchronize_session=False)
        
        # Log this critical operational event inside system AuditLog table
        audit = models.AuditLog(
            user_id=None, # System action
            action="DATABASE_ARCHIVE",
            details=f"System archiver pruned {len(archived_ids)} historical records older than 3 years (pre-{active_years[-1]}). Saved to archives/{filename}."
        )
        db.add(audit)
        
        db.commit()
        print(f"Success: Pruned {len(archived_ids)} historical rows from the live database tables.")
        print(f"Status: Database storage successfully freed.")
        
    except Exception as e:
        db.rollback()
        print(f"Error during database archiving: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    run_archiver()
