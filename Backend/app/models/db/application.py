from sqlalchemy import Column, String, Float, Integer, DateTime, Enum, JSON, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship  # <--- Added Import
from app.db.base import Base
from app.core.lifecycle.states import ApplicationStatus, RiskTier, DecisionOutcome

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(String, nullable=True, index=True)
    
    input_data = Column(JSON, nullable=False)
    
    # Lifecycle
    status = Column(Enum(ApplicationStatus, name="application_status_enum"), default=ApplicationStatus.CREATED, nullable=False, index=True)
    
    # Risk Profile
    current_tier = Column(
    Enum(
        RiskTier,
        name="risk_tier_enum",
        values_callable=lambda e: [m.value for m in e],  # ✅ IMPORTANT
    ),
    nullable=True,
    )
    credit_score = Column(Integer, nullable=True)
    pd_raw = Column(Float, nullable=True)
    
    # Economics
    expected_value = Column(Float, nullable=True)
    pricing_apr = Column(Float, nullable=True)
    approved_amount = Column(Float, nullable=True)
    
    # Explainability
    primary_decline_reason = Column(String, nullable=True)
    secondary_decline_reasons = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    decisioned_at = Column(DateTime(timezone=True), nullable=True)
    funded_at = Column(DateTime(timezone=True), nullable=True)

    # --- Relationships (Fixes InvalidRequestError) ---
    decisions = relationship("Decision", back_populates="application", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="application", cascade="all, delete-orphan")
    # NEW: Documents Store
    # Stores list of { "name": "paystub.pdf", "url": "...", "uploaded_at": "..." }
    documents = Column(JSON, nullable=True, default=list)

    # ---------------------------------------------------------
    # VIRTUAL PROPERTIES
    # ---------------------------------------------------------
    
    @property
    def economics(self):
        return {
            "expected_value": self.expected_value,
            "pricing_apr": self.pricing_apr,
            "monthly_payment": None 
        }

    @property
    def risk_profile(self):
        return {
            "pd_raw": self.pd_raw,
            "credit_score": self.credit_score,
            "tier": self.current_tier
        }

    @property
    def decision(self):
        outcome = None
        if self.primary_decline_reason:
            outcome = DecisionOutcome.DECLINE 
        elif self.status in [ApplicationStatus.OFFERED, ApplicationStatus.ACCEPTED, ApplicationStatus.FUNDED]:
            outcome = DecisionOutcome.APPROVE
        elif self.status == ApplicationStatus.MANUAL_REVIEW:
            outcome = DecisionOutcome.MANUAL_REVIEW
            
        if not outcome and not self.current_tier:
            return None

        return {
            "outcome": outcome,
            "tier": self.current_tier,
            "primary_decline_reason": self.primary_decline_reason
        }