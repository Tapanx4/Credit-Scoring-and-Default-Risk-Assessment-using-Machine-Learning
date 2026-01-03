# # =============================================================
# # api/v1/applications.py — FIXED & HARDENED
# # =============================================================
# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# import uuid
# from typing import List

# from app.api.deps import get_db
# from app.auth.dependencies import get_current_user
# from app.services.application_service import ApplicationService
# from app.models.schemas.application import ApplicationCreate, ApplicationResponse

# router = APIRouter()


# @router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
# def submit_application(
#     payload: ApplicationCreate,
#     db: Session = Depends(get_db),
#     user=Depends(get_current_user),
# ):
#     """
#     Submit a new loan application.
#     - Creates application (CREATED)
#     - Submits & scores immediately
#     """
#     service = ApplicationService(db)

#     app = service.create_application(payload, user_id=str(user.id))
#     return service.submit_and_score(app.id)


# @router.get("/{application_id}", response_model=ApplicationResponse)
# def get_application(
#     application_id: uuid.UUID,
#     db: Session = Depends(get_db),
#     user=Depends(get_current_user),
# ):
#     """Fetch a single application with ownership enforcement."""
#     service = ApplicationService(db)
#     app = service.get_application_by_id(application_id)

#     role = user.user_metadata.get("role", "applicant")
#     if role == "applicant" and str(app.user_id) != str(user.id):
#         raise HTTPException(status_code=403, detail="Not authorized")

#     return app


# @router.get("/", response_model=List[ApplicationResponse])
# def list_my_applications(
#     db: Session = Depends(get_db),
#     user=Depends(get_current_user),
# ):
#     """List applications for the current user."""
#     service = ApplicationService(db)
#     role = user.user_metadata.get("role", "applicant")

#     if role == "applicant":
#         return service.list_applications_for_user(user_id=str(user.id))

#     return service.list_recent_applications(limit=50)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List

from app.api.deps import get_db
from app.auth.dependencies import get_current_user
from app.services.application_service import ApplicationService
from app.models.schemas.application import ApplicationCreate, ApplicationResponse
from app.models.db.application import Application  # Moved to top level

router = APIRouter()
# --- DECISION ACTIONS (Moved here so URL is /applications/{id}/accept) ---

@router.post("/{application_id}/accept", response_model=ApplicationResponse)
def accept_offer(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Applicant accepts the loan offer.
    """
    service = ApplicationService(db)
    
    # Ownership Check
    app = service.get_application_by_id(application_id)
    user_role = user.app_metadata.get("role", "applicant")
    if user_role == "applicant" and str(app.user_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    try:
        updated_app = service.accept_offer(application_id, actor_id=str(user.id))
        return ApplicationResponse.from_orm(updated_app)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{application_id}/decline", response_model=ApplicationResponse)
def decline_offer(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Applicant declines the loan offer.
    """
    service = ApplicationService(db)
    
    # Ownership Check
    app = service.get_application_by_id(application_id)
    user_role = user.app_metadata.get("role", "applicant")
    if user_role == "applicant" and str(app.user_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        updated_app = service.decline_offer(application_id, actor_id=str(user.id))
        return ApplicationResponse.from_orm(updated_app)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
# @router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
# def submit_application(
#     payload: ApplicationCreate,
#     db: Session = Depends(get_db),
#     user = Depends(get_current_user)
# ):
    
#     """
#     Submit a new loan application.
#     """
#     service = ApplicationService(db)
    
#     # 1. Create
#     app = service.create_application(payload, user_id=user.id)
    
#     # 2. Score
#     scored_app = service.submit_and_score(app.id)
    
#     # FIX: Explicitly call from_orm to map flat DB model to nested Schema
#     return ApplicationResponse.from_orm(scored_app)
from fastapi import HTTPException, status
import traceback

@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def submit_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Submit a new loan application.
    """
    try:
        service = ApplicationService(db)

        # 1. Create
        app = service.create_application(payload, user_id=user.id)

        # 2. Score
        scored_app = service.submit_and_score(app.id)

        # 3. Map DB → API schema
        return ApplicationResponse.from_orm(scored_app)

    except Exception as e:
        # 🔥 PRINT FULL TRACEBACK TO CONSOLE
        print("\n🔥 SUBMIT APPLICATION ERROR 🔥")
        traceback.print_exc()

        # 🔁 Return a meaningful HTTP error to frontend
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Fetch details of a specific application.
    """
    service = ApplicationService(db)
    app = service.get_application_by_id(application_id)
    
    # Authorization Check
    user_role = user.app_metadata.get("role", "applicant")
    if user_role == "applicant" and str(app.user_id) != str(user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized to view this application"
        )
        
    # FIX: Explicit mapping
    return ApplicationResponse.from_orm(app)

@router.get("/", response_model=List[ApplicationResponse])
def list_my_applications(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    List all applications belonging to the authenticated user.
    """
    user_role = user.app_metadata.get("role", "applicant")
    
    query = db.query(Application)
    if user_role == "applicant":
        query = query.filter(Application.user_id == str(user.id))
        
    apps = query.order_by(Application.created_at.desc()).limit(50).all()
    
    # FIX: Explicit mapping for list
    return [ApplicationResponse.from_orm(a) for a in apps]