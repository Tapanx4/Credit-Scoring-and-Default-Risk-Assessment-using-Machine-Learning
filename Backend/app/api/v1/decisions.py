# =============================================================
# api/v1/decisions.py — READ-ONLY DECISION HISTORY (FIXED)
# =============================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.api.deps import get_db
from app.auth.dependencies import get_current_user
from app.auth.permissions import require_role
from app.services.decision_service import DecisionService
from app.models.schemas.decision import DecisionResponse

router = APIRouter()
@router.get("/application/{application_id}", response_model=List[DecisionResponse])
def get_application_decision_history(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Retrieve full immutable decision history for an application.
    Used by underwriters and admins.
    """
    require_role(user, ["underwriter", "admin"])

    service = DecisionService(db)
    return service.get_decision_history(application_id)
