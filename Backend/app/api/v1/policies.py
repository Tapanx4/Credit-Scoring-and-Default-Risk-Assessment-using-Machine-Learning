# =============================================================
# api/v1/policies.py — FIXED
# =============================================================
from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.auth.permissions import require_role
from app.services.policy_service import PolicyService

router = APIRouter()


@router.get("/current")
def get_active_policy(user=Depends(get_current_user)):
    """Expose current active credit policy metadata."""
    require_role(user, ["admin", "underwriter", "cro"])
    return PolicyService().get_active_policy_metadata()
