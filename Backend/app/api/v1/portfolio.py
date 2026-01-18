# =============================================================
# api/v1/portfolio.py — FIXED
# =============================================================
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional, List

from app.api.deps import get_db
from app.auth.dependencies import get_current_user
from app.auth.permissions import require_role
from app.services.portfolio_service import PortfolioService

router = APIRouter()


@router.get("/overview")
def get_portfolio_overview(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """High-level KPIs for Admin / CRO dashboard."""
    require_role(user, ["admin", "cro"])
    return PortfolioService(db).get_portfolio_overview()


@router.get("/tiers")
def get_tier_distribution(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Applications by Risk Tier."""
    require_role(user, ["admin", "cro"])
    return PortfolioService(db).get_tier_distribution()


# @router.get("/activity")
# def get_recent_activity(
#     limit: int = 20,
#     offset: int = 0,
#     search: str = None,
#     db: Session = Depends(get_db),
#     user = Depends(get_current_user)
# ):
#     """
#     Live feed with Search & Pagination.
#     """
#     require_role(user, ["admin", "underwriter"])
#     service = PortfolioService(db)
#     return service.get_recent_activity(limit=limit, offset=offset, search=search)
@router.get("/activity")
def get_recent_activity(
    limit: int = 20,
    offset: int = 0,
    search: Optional[str] = None, # <--- ADDED THIS PARAMETER
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Live feed of applications with optional search.
    """
    require_role(user, ["admin", "underwriter"])
    service = PortfolioService(db)
    # Pass search to service
    return service.get_recent_activity(limit=limit, offset=offset, search=search)
