# =============================================================
# services/decision_service.py — REVIEWED & IMPROVED
# =============================================================
from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List, Optional
import uuid

from app.models.db.decision import Decision


class DecisionService:
    """
    Read-only service for accessing decision history.
    Used by Admin dashboards, CRO analytics, and Underwriters.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_decision_history(self, application_id: uuid.UUID) -> List[Decision]:
        decisions = (
            self.db.query(Decision)
            .filter(Decision.application_id == application_id)
            .order_by(Decision.created_at.desc())
            .all()
        )
        return decisions

    def get_latest_decision(self, application_id: uuid.UUID) -> Optional[Decision]:
        return (
            self.db.query(Decision)
            .filter(Decision.application_id == application_id)
            .order_by(Decision.created_at.desc())
            .first()
        )

    def get_model_inputs(self, decision_id: uuid.UUID) -> dict:
        decision = self.db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(status_code=404, detail="Decision record not found")
        return decision.input_snapshot
