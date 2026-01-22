# # =============================================================
# # api/v1/portfolio.py — FIXED
# # =============================================================
# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from typing import Optional, List

# from app.api.deps import get_db
# from app.auth.dependencies import get_current_user
# from app.auth.permissions import require_role
# from app.services.portfolio_service import PortfolioService

# router = APIRouter()


# @router.get("/overview")
# def get_portfolio_overview(
#     db: Session = Depends(get_db),
#     user=Depends(get_current_user),
# ):
#     """High-level KPIs for Admin / CRO dashboard."""
#     require_role(user, ["admin", "cro"])
#     return PortfolioService(db).get_portfolio_overview()


# @router.get("/tiers")
# def get_tier_distribution(
#     db: Session = Depends(get_db),
#     user=Depends(get_current_user),
# ):
#     """Applications by Risk Tier."""
#     require_role(user, ["admin", "cro"])
#     return PortfolioService(db).get_tier_distribution()


# # @router.get("/activity")
# # def get_recent_activity(
# #     limit: int = 20,
# #     offset: int = 0,
# #     search: str = None,
# #     db: Session = Depends(get_db),
# #     user = Depends(get_current_user)
# # ):
# #     """
# #     Live feed with Search & Pagination.
# #     """
# #     require_role(user, ["admin", "underwriter"])
# #     service = PortfolioService(db)
# #     return service.get_recent_activity(limit=limit, offset=offset, search=search)
# @router.get("/activity")
# def get_recent_activity(
#     limit: int = 20,
#     offset: int = 0,
#     search: Optional[str] = None, # <--- ADDED THIS PARAMETER
#     db: Session = Depends(get_db),
#     user = Depends(get_current_user)
# ):
#     """
#     Live feed of applications with optional search.
#     """
#     require_role(user, ["admin", "underwriter"])
#     service = PortfolioService(db)
#     # Pass search to service
#     return service.get_recent_activity(limit=limit, offset=offset, search=search)
# api/v1/portfolio.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import traceback
import sys

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
    try:
        print("=== PORTFOLIO OVERVIEW CALLED ===", file=sys.stderr)
        print(f"User: {user}", file=sys.stderr)
        
        require_role(user, ["admin", "cro"])
        print("Role check passed", file=sys.stderr)
        
        service = PortfolioService(db)
        print("Service created", file=sys.stderr)
        
        result = service.get_portfolio_overview()
        print(f"Result: {result}", file=sys.stderr)
        
        return result
        
    except HTTPException as he:
        print(f"HTTP Exception: {he.detail}", file=sys.stderr)
        raise
    except Exception as e:
        print(f"=== ERROR IN PORTFOLIO OVERVIEW ===", file=sys.stderr)
        print(f"Error type: {type(e).__name__}", file=sys.stderr)
        print(f"Error message: {str(e)}", file=sys.stderr)
        print("=== FULL TRACEBACK ===", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {type(e).__name__}: {str(e)}"
        )


@router.get("/tiers")
def get_tier_distribution(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Applications by Risk Tier."""
    try:
        print("=== TIER DISTRIBUTION CALLED ===", file=sys.stderr)
        require_role(user, ["admin", "cro"])
        
        service = PortfolioService(db)
        result = service.get_tier_distribution()
        
        return result
        
    except HTTPException as he:
        raise
    except Exception as e:
        print(f"=== ERROR IN TIER DISTRIBUTION ===", file=sys.stderr)
        print(f"Error: {type(e).__name__}: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {type(e).__name__}: {str(e)}"
        )


@router.get("/activity")
def get_recent_activity(
    limit: int = 20,
    offset: int = 0,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Live feed of applications with optional search."""
    try:
        print("=== RECENT ACTIVITY CALLED ===", file=sys.stderr)
        print(f"Params - limit: {limit}, offset: {offset}, search: {search}", file=sys.stderr)
        
        require_role(user, ["admin", "underwriter"])
        
        service = PortfolioService(db)
        result = service.get_recent_activity(limit=limit, offset=offset, search=search)
        
        return result
        
    except HTTPException as he:
        raise
    except Exception as e:
        print(f"=== ERROR IN RECENT ACTIVITY ===", file=sys.stderr)
        print(f"Error: {type(e).__name__}: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {type(e).__name__}: {str(e)}"
        )