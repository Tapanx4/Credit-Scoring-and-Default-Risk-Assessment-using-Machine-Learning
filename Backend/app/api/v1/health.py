from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user

router = APIRouter()

@router.get("/")
def health_check():
    """
    Public health check. 
    Used by load balancers and to verify the app is running.
    """
    return {
        "status": "online",
        "service": "SmartLend Decision Engine",
        "version": "1.0.0"
    }

@router.get("/secure")
def secure_health_check(user = Depends(get_current_user)):
    """
    Protected health check.
    Verifies that Supabase Auth integration is working correctly.
    """
    return {
        "status": "authenticated",
        "user_id": user.id,
        "email": user.email,
        "roles": user.app_metadata.get("role", "none")
    }