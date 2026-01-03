from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base
from sqlalchemy.orm import relationship


class AuditLog(Base):
    """
    A persistent log of every state change and human action.
    Crucial for regulatory audits ("Who moved this loan to Funded?").
    """
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    
    # Action Details
    actor_id = Column(String, nullable=True) # User ID of the human/system
    action = Column(String, nullable=False)  # e.g. "STATE_CHANGE", "OVERRIDE"
    
    # State Transition
    from_state = Column(String, nullable=True)
    to_state = Column(String, nullable=True)
    
    # Metadata (e.g., Override reason)
    details = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="audit_logs")