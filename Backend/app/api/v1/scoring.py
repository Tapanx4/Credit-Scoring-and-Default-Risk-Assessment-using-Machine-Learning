
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from app.services.credit_bureau_service import CreditBureauService
from app.api.deps import get_db
from pydantic import BaseModel
from app.auth.dependencies import get_current_user
from app.auth.permissions import require_role
from app.services.application_service import ApplicationService
from app.models.schemas.application import ApplicationResponse

router = APIRouter()
# Schema for the simple check
class ScoreCheckRequest(BaseModel):
    ssn: str

@router.post("/peek")
def peek_credit_score(
    request: ScoreCheckRequest,
    user = Depends(get_current_user)
):
    """
    Stand-alone credit score check.
    Uses the Mock Bureau to generate the FICO score deterministically from SSN.
    """
    try:
        # We use the bureau service directly
        bureau = CreditBureauService()
        # The pull_report method handles SSN hashing and deterministic generation
        report = bureau.pull_report({"ssn": request.ssn})
        return {"fico": report.get("fico_score")}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Score check failed: {str(e)}")

@router.post("/{application_id}", response_model=ApplicationResponse)
def re_score_application(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Manually re-trigger the Scoring Engine.
    """
    require_role(user, ["underwriter", "admin"])
    
    service = ApplicationService(db)
    
    try:
        updated_app = service.re_score(
            application_id=application_id, 
            actor_id=str(user.id)
        )
        # FIX: Explicit mapping
        return ApplicationResponse.from_orm(updated_app)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Re-scoring failed: {str(e)}"
        )
