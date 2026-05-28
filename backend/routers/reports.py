import datetime
import io
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
import pandas as pd
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import (
    require_dse_or_dce,
)

router = APIRouter(prefix="/api/reports", tags=["Reports & Exports"])


# Helper: Log standard system audits
def log_action(db: Session, user_id: int, action: str, details: str):
    log = models.AuditLog(user_id=user_id, action=action, details=details)
    db.add(log)
    db.commit()


@router.get("/export")
def export_projects_to_excel(
    circle_id: Optional[int] = None,
    division_id: Optional[int] = None,
    scheme: Optional[str] = None,
    year: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_dse_or_dce)
):
    query = db.query(models.ProjectEntry).filter(models.ProjectEntry.is_deleted == False)
    
    # Scope visibility based on user
    if current_user.role == "DSE":
        team_de_ids = [u.id for u in db.query(models.User).filter(
            models.User.assigned_dse_id == current_user.id,
            models.User.is_deleted == False
        ).all()]
        query = query.filter(models.ProjectEntry.created_by_id.in_(team_de_ids))
    elif current_user.role == "DCE":
        query = query.filter(models.ProjectEntry.status == "APPROVED")

    # Apply filters
    if circle_id:
        query = query.filter(models.ProjectEntry.circle_id == circle_id)
    if division_id:
        query = query.filter(models.ProjectEntry.division_id == division_id)
    if scheme:
        query = query.filter(models.ProjectEntry.scheme.ilike(f"%{scheme}%"))
    if year:
        query = query.filter(models.ProjectEntry.year == year)
        
    entries = query.order_by(models.ProjectEntry.circle_id, models.ProjectEntry.division_id).all()

    # Process records to dataframe
    data_list = []
    for idx, entry in enumerate(entries, start=1):
        data_list.append({
            "Sl.No": idx,
            "Circle": entry.circle.name if entry.circle else "",
            "Division": entry.division.name if entry.division else "",
            "Scheme": entry.scheme,
            "Year": entry.year,
            "G.O. Details": entry.go_details or "",
            "Technical Sanction Details": entry.technical_sanction or "",
            "Administrative Sanction Value (Lakhs)": entry.admin_sanction_value or 0.0,
            "Technical Sanction Value (Lakhs)": entry.tech_sanction_value or 0.0,
            "Tender Notice No": entry.tender_notice_no or "",
            "Tender Notice Date": str(entry.tender_notice_date) if entry.tender_notice_date else "",
            "Name of Work": entry.name_of_work,
            "Contract Value (Lakhs)": entry.contract_value or 0.0,
            "Bid Submission Date": str(entry.bid_submission_date) if entry.bid_submission_date else "",
            "Bid Opening Date": str(entry.bid_opening_date) if entry.bid_opening_date else "",
            "Tender Accepting Authority": entry.tender_accepting_authority or "",
            "Tender Approved On": str(entry.tender_approved_on) if entry.tender_approved_on else "",
            "Work Order Issued On": str(entry.work_order_issued_on) if entry.work_order_issued_on else "",
            "Agreement Executed On": str(entry.agreement_executed_on) if entry.agreement_executed_on else "",
            "Present Stage of Work": entry.present_stage or "",
            "Remarks": entry.remarks or "",
            "Approval Status": entry.status
        })

    df = pd.DataFrame(data_list)
    
    # Save dataframe to memory as stream
    output_stream = io.BytesIO()
    with pd.ExcelWriter(output_stream, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Project Records", index=False)
    
    output_stream.seek(0)
    
    filename = f"nhrs_highway_tenders_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    if background_tasks:
        background_tasks.add_task(log_action, db, current_user.id, "EXPORT_EXCEL", f"Exported project reports matching search filters.")
    else:
        log_action(db, current_user.id, "EXPORT_EXCEL", f"Exported project reports matching search filters.")
    
    return StreamingResponse(
        output_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
