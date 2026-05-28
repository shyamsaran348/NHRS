import datetime
import enum
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from database import Base


class UserRole(str, enum.Enum):
    DCE = "DCE"
    DSE = "DSE"
    DE = "DE"


class Circle(Base):
    __tablename__ = "circles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    divisions = relationship("Division", back_populates="circle")
    users = relationship("User", back_populates="circle")
    project_entries = relationship("ProjectEntry", back_populates="circle")


class Division(Base):
    __tablename__ = "divisions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    circle_id = Column(Integer, ForeignKey("circles.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    circle = relationship("Circle", back_populates="divisions")
    users = relationship("User", back_populates="division")
    project_entries = relationship("ProjectEntry", back_populates="division")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, name="user_role_enum"), nullable=False)  # "DCE", "DSE", "DE"
    
    # Hierarchical linkings
    circle_id = Column(Integer, ForeignKey("circles.id", ondelete="SET NULL"), nullable=True)
    division_id = Column(Integer, ForeignKey("divisions.id", ondelete="SET NULL"), nullable=True)
    
    # Self-referencing link (maps DE to their DSE manager)
    assigned_dse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    circle = relationship("Circle", back_populates="users")
    division = relationship("Division", back_populates="users")
    
    # Self-referencing relationship for team assignment
    dse_manager = relationship("User", remote_side=[id], backref="team_members")
    
    project_entries = relationship("ProjectEntry", back_populates="creator")
    audit_logs = relationship("AuditLog", back_populates="user")


class ProjectEntry(Base):
    __tablename__ = "project_entries"

    id = Column(Integer, primary_key=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    circle_id = Column(Integer, ForeignKey("circles.id", ondelete="CASCADE"), nullable=False, index=True)
    division_id = Column(Integer, ForeignKey("divisions.id", ondelete="CASCADE"), nullable=False, index=True)

    # Tender / Work Form columns
    scheme = Column(String(100), nullable=False)
    year = Column(String(20), nullable=False)
    go_details = Column(Text, nullable=True)
    technical_sanction = Column(Text, nullable=True)
    admin_sanction_value = Column(Float, nullable=True)  # in Lakhs
    tech_sanction_value = Column(Float, nullable=True)   # in Lakhs
    tender_notice_no = Column(String(100), nullable=True)
    tender_notice_date = Column(Date, nullable=True)
    name_of_work = Column(Text, nullable=False)
    contract_value = Column(Float, nullable=True)        # in Lakhs
    bid_submission_date = Column(Date, nullable=True)
    bid_opening_date = Column(Date, nullable=True)
    tender_accepting_authority = Column(String(100), nullable=True)  # COT/CE/SE/DE
    tender_approved_on = Column(Date, nullable=True)
    work_order_issued_on = Column(Date, nullable=True)
    agreement_executed_on = Column(Date, nullable=True)
    present_stage = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)

    # Review Workflow columns
    status = Column(String(50), default="PENDING", index=True)  # "PENDING", "APPROVED", "REJECTED"
    rejection_reason = Column(Text, nullable=True)
    
    is_deleted = Column(Boolean, default=False)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="project_entries")
    circle = relationship("Circle", back_populates="project_entries")
    division = relationship("Division", back_populates="project_entries")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # "CREATE_ENTRY", "EDIT_ENTRY", "APPROVE_ENTRY", "REJECT_ENTRY", "ADD_TEAM_MEMBER", "REMOVE_TEAM_MEMBER", "LOGIN"
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
