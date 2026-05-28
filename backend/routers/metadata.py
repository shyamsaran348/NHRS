from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api", tags=["Metadata"])


@router.get("/circles", response_model=List[schemas.CircleResponse])
def get_circles(
    db: Session = Depends(get_db)
):
    return db.query(models.Circle).order_by(models.Circle.name).all()


@router.get("/divisions", response_model=List[schemas.DivisionResponse])
def get_divisions(
    circle_id: Optional[int] = Query(None, description="Filter divisions by Circle ID"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Division)
    if circle_id is not None:
        query = query.filter(models.Division.circle_id == circle_id)
    return query.order_by(models.Division.name).all()
