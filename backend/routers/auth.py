from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import (
    get_current_user,
    verify_password,
    create_access_token,
    hash_password,
    require_dce,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# Helper: Log standard system audits
def log_action(db: Session, user_id: int, action: str, details: str):
    log = models.AuditLog(user_id=user_id, action=action, details=details)
    db.add(log)
    db.commit()


@router.post("/login", response_model=schemas.UserToken)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.email == login_data.email, 
        models.User.is_deleted == False
    ).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Your account is pending administrative approval from the Deputy Chief Engineer (DCE)."
        )

    # Log login action
    log_action(db, user.id, "LOGIN", f"User {user.email} successfully logged in.")

    # Create JWT access token
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "email": user.email,
        "name": user.name,
        "circle_id": user.circle_id,
        "division_id": user.division_id,
    }


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/register", response_model=schemas.UserResponse)
def register(register_data: schemas.UserRegister, db: Session = Depends(get_db)):
    # 1. Email check
    existing_user = db.query(models.User).filter(
        models.User.email == register_data.email,
        models.User.is_deleted == False
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Official email is already registered inside portal directories."
        )

    # 2. Role safeguard validation
    if register_data.role not in ["DE", "DSE"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Divisional Engineers (DE) and Superintendent Engineers (DSE) are allowed to register publicly."
        )

    # 3. Create inactive User model (pending DCE approval)
    hashed_pwd = hash_password(register_data.password)
    
    new_user = models.User(
        name=register_data.name,
        email=register_data.email,
        password_hash=hashed_pwd,
        role=register_data.role,
        circle_id=register_data.circle_id,
        division_id=register_data.division_id if register_data.role == "DE" else None,
        is_active=False,
    )

    # 4. Auto-Manager Assignment for new DEs (only links if the Circle DSE is already active/approved)
    if new_user.role == "DE" and new_user.circle_id:
        circle_dse = db.query(models.User).filter(
            models.User.circle_id == new_user.circle_id,
            models.User.role == "DSE",
            models.User.is_active == True,
            models.User.is_deleted == False
        ).first()
        
        if circle_dse:
            new_user.assigned_dse_id = circle_dse.id

    # 5. Commit database changes
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 6. Write permanent log event in AuditLog
    log_action(db, new_user.id, "REGISTER", f"Account credentials requested under designation: {new_user.role} (Pending Approval).")

    return new_user


@router.get("/users/pending", response_model=List[schemas.UserResponse])
def get_pending_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_dce)
):
    return db.query(models.User).filter(
        models.User.is_active == False,
        models.User.is_deleted == False
    ).order_by(models.User.created_at.desc()).all()


@router.put("/users/{id}/approve")
def approve_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_dce)
):
    user = db.query(models.User).filter(
        models.User.id == id,
        models.User.is_deleted == False
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User account not found or already deleted.")
        
    user.is_active = True
    db.commit()
    db.refresh(user)

    # If the approved user is a DSE, scan for existing unassigned DEs in the same Circle to auto-assign
    if user.role == "DSE" and user.circle_id:
        unassigned_des = db.query(models.User).filter(
            models.User.circle_id == user.circle_id,
            models.User.role == "DE",
            models.User.assigned_dse_id == None,
            models.User.is_deleted == False
        ).all()
        for de in unassigned_des:
            de.assigned_dse_id = user.id
        db.commit()

    log_action(db, current_user.id, "APPROVE_USER", f"Approved user signup credentials for: {user.email}")
    log_action(db, user.id, "APPROVED_BY_ADMIN", "Portal credentials approved by Deputy Chief Engineer (DCE).")
    
    return {"status": "approved", "user_id": id}


@router.put("/users/{id}/reject")
def reject_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_dce)
):
    user = db.query(models.User).filter(
        models.User.id == id,
        models.User.is_deleted == False
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User account not found or already deleted.")
        
    user.is_deleted = True
    user.is_active = False
    db.commit()

    log_action(db, current_user.id, "REJECT_USER", f"Rejected user signup credentials for: {user.email}")
    
    return {"status": "rejected", "user_id": id}


@router.put("/profile", response_model=schemas.UserResponse)
def update_profile(
    profile_data: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    updated_fields = []
    
    if profile_data.name is not None:
        trimmed_name = profile_data.name.strip()
        if len(trimmed_name) < 2:
            raise HTTPException(status_code=400, detail="Full Name must be at least 2 characters.")
        current_user.name = trimmed_name
        updated_fields.append("name")

    if profile_data.password is not None and profile_data.password != "":
        current_user.password_hash = hash_password(profile_data.password)
        updated_fields.append("password")

    if not updated_fields:
        return current_user

    db.commit()
    db.refresh(current_user)

    details = f"User updated profile fields: {', '.join(updated_fields)}."
    log_action(db, current_user.id, "UPDATE_PROFILE", details)

    return current_user
