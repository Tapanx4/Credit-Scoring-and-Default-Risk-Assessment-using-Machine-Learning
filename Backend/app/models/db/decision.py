# =============================================================
# models/db/decision.py — ENUM SAFE (FIXED)
# =============================================================
from sqlalchemy import Column, String, Float, DateTime, Enum, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.lifecycle.states import DecisionOutcome, RiskTier


class Decision(Base):
    """
    Immutable record of a model run.
    """

    __tablename__ = "decisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(
        UUID(as_uuid=True),
        ForeignKey("applications.id"),
        nullable=False,
    )

    outcome = Column(
        Enum(
            DecisionOutcome,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
    )

    assigned_tier = Column(
        Enum(
            RiskTier,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
    )

    model_version = Column(String, nullable=False)
    pd_probability = Column(Float, nullable=False)
    expected_value = Column(Float, nullable=False)

    input_snapshot = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="decisions")
