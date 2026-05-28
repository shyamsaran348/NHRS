from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import (
    require_dce,
)

router = APIRouter(prefix="/api", tags=["System Auditing"])


@router.get("/audit-logs", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(
    limit: int = Query(100, ge=1, le=1000, description="Retrieve limit for audit journals"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_dce)
):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(limit).all()
