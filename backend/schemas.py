from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# Circle schemas
class CircleBase(BaseModel):
    name: str

class CircleResponse(CircleBase):
    id: int
    class Config:
        from_attributes = True


# Division schemas
class DivisionBase(BaseModel):
    name: str
    circle_id: int

class DivisionResponse(DivisionBase):
    id: int
    class Config:
        from_attributes = True


# User schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str  # "DCE", "DSE", "DE"
    circle_id: Optional[int] = None
    division_id: Optional[int] = None
    assigned_dse_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    circle: Optional[CircleResponse] = None
    division: Optional[DivisionResponse] = None

    class Config:
        from_attributes = True

import re
from pydantic import BaseModel, EmailStr, Field, field_validator

class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        # Secure Password Policy: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character.")
        return v

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str
    role: str  # "DE", "DSE"
    circle_id: Optional[int] = None
    division_id: Optional[int] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        return UserLogin.validate_password_strength(v)

class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    password: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        return UserLogin.validate_password_strength(v)

class UserToken(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
    name: str
    circle_id: Optional[int] = None
    division_id: Optional[int] = None


# Project Entry schemas
class ProjectEntryBase(BaseModel):
    scheme: str = Field(..., description="Scheme name (e.g. CRIDP)")
    year: str = Field(..., description="Financial year (e.g. 2025-26)")
    go_details: Optional[str] = Field(None, description="G.O. details")
    technical_sanction: Optional[str] = Field(None, description="Technical Sanction details")
    admin_sanction_value: Optional[float] = Field(None, description="Administrative Sanction Value in Lakhs")
    tech_sanction_value: Optional[float] = Field(None, description="Technical Sanction Value in Lakhs")
    tender_notice_no: Optional[str] = Field(None, description="Tender notice number")
    tender_notice_date: Optional[date] = Field(None, description="Tender notice date")
    name_of_work: str = Field(..., description="Name of the work / project details")
    contract_value: Optional[float] = Field(None, description="Contract Value in Lakhs")
    bid_submission_date: Optional[date] = Field(None, description="Bid Submission date")
    bid_opening_date: Optional[date] = Field(None, description="Bid Opening date")
    tender_accepting_authority: Optional[str] = Field(None, description="Tender Accepting Authority (COT/CE/SE/DE)")
    tender_approved_on: Optional[date] = Field(None, description="Tender Approved on date")
    work_order_issued_on: Optional[date] = Field(None, description="Work Order Issued on date")
    agreement_executed_on: Optional[date] = Field(None, description="Agreement Executed on date")
    present_stage: Optional[str] = Field(None, description="Present stage of work")
    remarks: Optional[str] = Field(None, description="Remarks")

class ProjectEntryCreate(ProjectEntryBase):
    pass

class ProjectEntryUpdate(ProjectEntryBase):
    pass

class ProjectEntryResponse(ProjectEntryBase):
    id: int
    created_by_id: int
    circle_id: int
    division_id: int
    status: str  # "PENDING", "APPROVED", "REJECTED"
    rejection_reason: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested relationships for details
    creator: Optional[UserResponse] = None
    circle: Optional[CircleResponse] = None
    division: Optional[DivisionResponse] = None

    class Config:
        from_attributes = True


# Review schema for DSE (Approve/Reject)
class ProjectReview(BaseModel):
    status: str = Field(..., pattern="^(APPROVED|REJECTED)$", description="Must be either APPROVED or REJECTED")
    rejection_reason: Optional[str] = Field(None, description="Mandatory if status is REJECTED")


# Audit Log schema
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    timestamp: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# Team Management schema
class TeamMemberAdd(BaseModel):
    de_id: int
