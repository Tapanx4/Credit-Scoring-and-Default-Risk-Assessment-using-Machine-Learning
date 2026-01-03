# # =============================================================
# # api/v1/overrides.py — UNDERWRITER OVERRIDES (FIXED)
# # =============================================================
# from fastapi import APIRouter, Depends, Body, HTTPException, status
# from sqlalchemy.orm import Session
# import uuid

# from app.api.deps import get_db
# from app.auth.dependencies import get_current_user
# from app.auth.permissions import require_role
# from app.services.override_service import OverrideService
# from app.models.schemas.application import ApplicationResponse
# from app.core.lifecycle.states import ApplicationStatus

# router = APIRouter()


# @router.post("/{application_id}/approve", response_model=ApplicationResponse)
# def manual_approve(
#     application_id: uuid.UUID,
#     reason: str = Body(..., embed=True),
#     notes: str | None = Body(None, embed=True),
#     db: Session = Depends(get_db),
#     user=Depends(get_current_user),
# ):
#     """
#     Underwriter override: MANUAL_REVIEW → OFFERED
#     Fully audited.
#     """
#     require_role(user, ["underwriter", "admin"])

#     service = OverrideService(db)

#     try:
#         return service.approve_application(
#             application_id=application_id,
#             actor_id=str(user.id),
#             reason=reason,
#             notes=notes,
#         )
#     except ValueError as e:
#         raise HTTPException(
#             status_code=status.HTTP_409_CONFLICT,
#             detail=str(e),
#         )


# @router.post("/{application_id}/decline", response_model=ApplicationResponse)
# def manual_decline(
#     application_id: uuid.UUID,
#     reason_code: str = Body(..., embed=True),
#     notes: str | None = Body(None, embed=True),
#     db: Session = Depends(get_db),
#     user=Depends(get_current_user),
# ):
#     """
#     Underwriter override: Force DECLINE
#     Fully audited.
#     """
#     require_role(user, ["underwriter", "admin"])

#     service = OverrideService(db)

#     try:
#         return service.decline_application(
#             application_id=application_id,
#             actor_id=str(user.id),
#             reason_code=reason_code,
#             notes=notes,
#         )
#     except ValueError as e:
#         raise HTTPException(
#             status_code=status.HTTP_409_CONFLICT,
#             detail=str(e),
#         )
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