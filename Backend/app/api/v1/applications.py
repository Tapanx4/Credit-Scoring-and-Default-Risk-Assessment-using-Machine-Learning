from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List
from fastapi import Body
from app.auth.permissions import require_role
from app.api.deps import get_db
from app.auth.dependencies import get_current_user
from app.services.application_service import ApplicationService
from app.models.schemas.application import ApplicationCreate, ApplicationResponse
from app.models.db.application import Application  # Moved to top level

router = APIRouter()
# --- DECISION ACTIONS (Moved here so URL is /applications/{id}/accept) ---
@router.post("/{application_id}/documents", response_model=ApplicationResponse)
def upload_document(
    application_id: uuid.UUID,
    document: dict = Body(...), # {name, url, type}
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Attach a document reference to an application.
    """
    # Verify access (Applicant can upload to own, Staff can upload to any)
    service = ApplicationService(db)
    app = service.get_application_by_id(application_id)
    user_role = user.app_metadata.get("role", "applicant")
    
    if user_role == "applicant" and str(app.user_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    return ApplicationResponse.from_orm(
        service.attach_document(application_id, document, str(user.id))
    )
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
@router.post("/{application_id}/documents", response_model=ApplicationResponse)
def upload_document(
    application_id: uuid.UUID,
    document: dict = Body(..., description="File metadata: {name, url, type}"),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Attach a document reference to an application.
    """
    service = ApplicationService(db)
    
    # Auth check
    app = service.get_application_by_id(application_id)
    user_role = user.app_metadata.get("role", "applicant")
    if user_role == "applicant" and str(app.user_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        updated_app = service.attach_document(application_id, document, actor_id=str(user.id))
        return ApplicationResponse.from_orm(updated_app)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
@router.post("/{application_id}/request-documents", response_model=ApplicationResponse)
def request_documents(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    require_role(user, ["underwriter", "admin"]) # Only staff can request
    service = ApplicationService(db)
    try:
        return ApplicationResponse.from_orm(
            service.request_documents(application_id, str(user.id))
        )
    except Exception as e:
        import traceback
        print("\n🔥 REQUEST DOCUMENTS ERROR 🔥")
        traceback.print_exc()

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
@router.post("/{application_id}/fund", response_model=ApplicationResponse)
def fund_application(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Admin action: Fund a loan.
    Transition: ACCEPTED -> FUNDED
    """
    # Only Admins can disburse funds
    require_role(user, ["admin"])
    
    service = ApplicationService(db)
    try:
        updated_app = service.fund_application(application_id, actor_id=str(user.id))
        return ApplicationResponse.from_orm(updated_app)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
