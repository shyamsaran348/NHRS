import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import (
    get_current_user,
    require_dse,
    require_de,
)

router = APIRouter(prefix="/api/entries", tags=["Project Entries"])


# Helper: Log standard system audits
def log_action(db: Session, user_id: int, action: str, details: str):
    log = models.AuditLog(user_id=user_id, action=action, details=details)
    db.add(log)
    db.commit()


@router.post("", response_model=schemas.ProjectEntryResponse)
def create_project_entry(
    entry_data: schemas.ProjectEntryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_de)
):
    # Enforce database security: auto-bind Circle and Division from user profile
    new_entry = models.ProjectEntry(
        **entry_data.model_dump(),
        created_by_id=current_user.id,
        circle_id=current_user.circle_id,
        division_id=current_user.division_id,
        status="PENDING"
    )
    
    try:
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        
        log_action(
            db, 
            current_user.id, 
            "CREATE_ENTRY", 
            f"Created project entry #{new_entry.id} ('{new_entry.name_of_work}') in division ID {current_user.division_id}."
        )
        return new_entry
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction failed while creating record: {e}"
        )


@router.get("", response_model=List[schemas.ProjectEntryResponse])
def list_project_entries(
    scheme: Optional[str] = None,
    year: Optional[str] = None,
    circle_id: Optional[int] = None,
    division_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    stage: Optional[str] = None,
    limit: int = Query(50, ge=1, le=1000, description="Pagination result limit"),
    offset: int = Query(0, ge=0, description="Pagination query offset"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.ProjectEntry).filter(models.ProjectEntry.is_deleted == False)

    # 1. Enforce row-level backend isolation rules
    if current_user.role == "DE":
        query = query.filter(models.ProjectEntry.created_by_id == current_user.id)
    elif current_user.role == "DSE":
        # DSE sees entries belonging to their circle DE team members
        team_de_ids = [u.id for u in db.query(models.User).filter(
            models.User.assigned_dse_id == current_user.id,
            models.User.is_deleted == False
        ).all()]
        query = query.filter(models.ProjectEntry.created_by_id.in_(team_de_ids))
    elif current_user.role == "DCE":
        # DCE centrally views APPROVED records from ALL circles
        query = query.filter(models.ProjectEntry.status == "APPROVED")
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Unauthorized role classification"
        )

    # 2. Dynamic Filtering
    if scheme:
        query = query.filter(models.ProjectEntry.scheme.ilike(f"%{scheme}%"))
    if year:
        query = query.filter(models.ProjectEntry.year == year)
    if circle_id:
        query = query.filter(models.ProjectEntry.circle_id == circle_id)
    if division_id:
        query = query.filter(models.ProjectEntry.division_id == division_id)
    if status_filter:
        query = query.filter(models.ProjectEntry.status == status_filter)
    if stage:
        query = query.filter(models.ProjectEntry.present_stage.ilike(f"%{stage}%"))

    # Apply order and pagination limits
    return query.order_by(models.ProjectEntry.submitted_at.desc()).offset(offset).limit(limit).all()


@router.get("/{entry_id}", response_model=schemas.ProjectEntryResponse)
def get_project_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    entry = db.query(models.ProjectEntry).filter(
        models.ProjectEntry.id == entry_id,
        models.ProjectEntry.is_deleted == False
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Project entry not found")
        
    # Enforce role boundaries for viewing single entry
    if current_user.role == "DE":
        if entry.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied to other user's projects")
    elif current_user.role == "DSE":
        creator = db.query(models.User).filter(models.User.id == entry.created_by_id).first()
        if not creator or creator.assigned_dse_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied. Project creator is not in your team.")
    elif current_user.role == "DCE":
        if entry.status != "APPROVED":
            raise HTTPException(status_code=403, detail="DCE can only view approved records.")

    return entry


@router.put("/{entry_id}", response_model=schemas.ProjectEntryResponse)
def update_project_entry(
    entry_id: int,
    updated_data: schemas.ProjectEntryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    entry = db.query(models.ProjectEntry).filter(
        models.ProjectEntry.id == entry_id,
        models.ProjectEntry.is_deleted == False
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Project entry not found")
        
    # Role-based editing rules
    if current_user.role == "DE":
        if entry.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        if entry.status not in ["PENDING", "REJECTED"]:
            raise HTTPException(status_code=400, detail="Cannot edit project once it has been approved.")
        
        # Reset rejected entry to PENDING (Resubmitted)
        if entry.status == "REJECTED":
            entry.status = "PENDING"
            entry.rejection_reason = None
            entry.submitted_at = datetime.datetime.utcnow()

    elif current_user.role == "DSE":
        creator = db.query(models.User).filter(models.User.id == entry.created_by_id).first()
        if not creator or creator.assigned_dse_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied. Project creator not in team.")
            
    elif current_user.role == "DCE":
        if entry.status != "APPROVED":
            raise HTTPException(status_code=400, detail="DCE can only edit approved records.")
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    # Update fields and commit
    try:
        for field, value in updated_data.model_dump().items():
            setattr(entry, field, value)
            
        db.commit()
        db.refresh(entry)
        log_action(db, current_user.id, "EDIT_ENTRY", f"Modified project entry #{entry.id} details.")
        return entry
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction failed while editing record: {e}"
        )


@router.put("/{entry_id}/review", response_model=schemas.ProjectEntryResponse)
def review_project_entry(
    entry_id: int,
    review: schemas.ProjectReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_dse)
):
    entry = db.query(models.ProjectEntry).filter(
        models.ProjectEntry.id == entry_id,
        models.ProjectEntry.is_deleted == False
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Project entry not found")
        
    # Ensure entry creator is in DSE's circle team
    creator = db.query(models.User).filter(models.User.id == entry.created_by_id).first()
    if not creator or creator.assigned_dse_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. Project creator not in team.")
        
    if entry.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Cannot review entry with status '{entry.status}'.")

    # Process Review and commit
    try:
        entry.status = review.status
        if review.status == "REJECTED":
            if not review.rejection_reason:
                raise HTTPException(status_code=400, detail="Rejection reason is required.")
            entry.rejection_reason = review.rejection_reason
        else:
            entry.rejection_reason = None
            
        entry.reviewed_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(entry)
        
        log_action(
            db, 
            current_user.id, 
            f"REVIEW_{review.status}", 
            f"Reviewed project #{entry.id}. Action: {review.status}. Reason: {review.rejection_reason}"
        )
        return entry
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction failed while reviewing: {e}"
        )


@router.delete("/{entry_id}", status_code=204)
def delete_project_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    entry = db.query(models.ProjectEntry).filter(
        models.ProjectEntry.id == entry_id,
        models.ProjectEntry.is_deleted == False
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Project entry not found")
        
    # Enforce soft-deletion rights
    if current_user.role == "DE":
        if entry.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        if entry.status not in ["PENDING", "REJECTED"]:
            raise HTTPException(status_code=400, detail="Cannot delete an approved project entry.")
    elif current_user.role == "DSE":
        creator = db.query(models.User).filter(models.User.id == entry.created_by_id).first()
        if not creator or creator.assigned_dse_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "DCE":
        pass
    else:
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        # Enforce soft-delete rule
        entry.is_deleted = True
        db.commit()
        log_action(db, current_user.id, "DELETE_ENTRY", f"Soft-deleted project entry #{entry_id}.")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction failed while soft-deleting: {e}"
        )
