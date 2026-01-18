from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
import uuid

from app.api.deps import get_db
from app.auth.dependencies import get_current_user
from app.auth.permissions import require_role
from app.services.override_service import OverrideService
from app.models.schemas.application import ApplicationResponse

router = APIRouter()

@router.post("/{application_id}/approve", response_model=ApplicationResponse)
def manual_approve(
    application_id: uuid.UUID,
    reason: str = Body(..., embed=True),
    notes: str = Body(None, embed=True),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Underwriter Override: Force Approve.
    """
    require_role(user, ["underwriter", "admin"])
    
    service = OverrideService(db)
    app = service.approve_application(
        application_id=application_id, 
        actor_id=str(user.id), 
        reason=reason, 
        notes=notes
    )
    # FIX: Explicit mapping
    return ApplicationResponse.from_orm(app)

@router.post("/{application_id}/decline", response_model=ApplicationResponse)
def manual_decline(
    application_id: uuid.UUID,
    reason_code: str = Body(..., embed=True),
    notes: str = Body(None, embed=True),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Underwriter Override: Force Decline.
    """
    require_role(user, ["underwriter", "admin"])
    
    service = OverrideService(db)
    app = service.decline_application(
        application_id=application_id, 
        actor_id=str(user.id), 
        reason_code=reason_code, 
        notes=notes
    )
    # FIX: Explicit mapping
    return ApplicationResponse.from_orm(app)