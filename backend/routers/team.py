from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import (
    require_dse,
)

router = APIRouter(prefix="/api", tags=["Team Management"])


# Helper: Log standard system audits
def log_action(db: Session, user_id: int, action: str, details: str):
    log = models.AuditLog(user_id=user_id, action=action, details=details)
    db.add(log)
    db.commit()


@router.get("/users/unassigned", response_model=List[schemas.UserResponse])
def get_unassigned_des(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_dse)
):
    # Only active, non-deleted DEs who are not yet in any DSE team in the circle
    return db.query(models.User).filter(
        models.User.role == "DE",
        models.User.circle_id == current_user.circle_id,
        models.User.assigned_dse_id == None,
        models.User.is_active == True,
        models.User.is_deleted == False
    ).order_by(models.User.name).all()


@router.get("/team", response_model=List[schemas.UserResponse])
def get_my_team(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_dse)
):
    # List of DEs in this DSE's team
    return db.query(models.User).filter(
        models.User.assigned_dse_id == current_user.id,
        models.User.is_deleted == False
    ).order_by(models.User.name).all()


@router.post("/team", response_model=schemas.UserResponse)
def add_team_member(
    action: schemas.TeamMemberAdd,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_dse)
):
    de = db.query(models.User).filter(
        models.User.id == action.de_id,
        models.User.role == "DE",
        models.User.is_deleted == False
    ).first()
    
    if not de:
        raise HTTPException(status_code=404, detail="Divisional Engineer not found")
    
    if de.circle_id != current_user.circle_id:
        raise HTTPException(
            status_code=400, 
            detail="You can only add Divisional Engineers belonging to your own circle."
        )
        
    if de.assigned_dse_id is not None:
        raise HTTPException(status_code=400, detail="This Divisional Engineer is already assigned to a team.")
        
    try:
        de.assigned_dse_id = current_user.id
        db.commit()
        db.refresh(de)
        log_action(db, current_user.id, "ADD_TEAM_MEMBER", f"Added DE {de.email} to team.")
        return de
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database transaction failure: {e}")


@router.delete("/team/{de_id}", response_model=schemas.UserResponse)
def remove_team_member(
    de_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_dse)
):
    de = db.query(models.User).filter(
        models.User.id == de_id,
        models.User.assigned_dse_id == current_user.id,
        models.User.is_deleted == False
    ).first()
    
    if not de:
        raise HTTPException(status_code=404, detail="Divisional Engineer not in your team")
        
    try:
        de.assigned_dse_id = None
        db.commit()
        db.refresh(de)
        log_action(db, current_user.id, "REMOVE_TEAM_MEMBER", f"Removed DE {de.email} from team.")
        return de
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database transaction failure: {e}")
