# =============================================================
# models/schema/decision.py — VERIFIED
# =============================================================
from pydantic import BaseModel, ConfigDict
from typing import Dict, Any
from datetime import datetime

from app.core.lifecycle.states import DecisionOutcome, RiskTier


class DecisionResponse(BaseModel):
    """
    Immutable snapshot of a decision event.
    Safe for list & detail views.
    """

    id: str
    application_id: str

    outcome: DecisionOutcome
    assigned_tier: RiskTier

    model_version: str
    pd_probability: float
    expected_value: float

    created_at: datetime

    # Exposed only in detail contexts (still safe)
    input_snapshot: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)
